import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Play, RefreshCw, Key, Eye, HelpCircle, Sparkles, Mic, MicOff,
  Square, UserCheck, Clock, Video, VideoOff, Award, TrendingUp, AlertTriangle, AlertCircle,
  Volume2, VolumeX, User, Bot, Radio, CheckCircle, RefreshCcw, Check
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const MockInterviewArena = ({ questions, loading, onRefresh, targetUsername }) => {
  // Steps: 'intro' (ready to start), 'interviewing' (sequencing questions), 'submitting' (calculating evaluation), 'report' (showing detailed report card)
  const [step, setStep] = useState('intro');
  const [currentIdx, setCurrentIdx] = useState(0);

  // Webcam & proctoring states
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [cameraPermission, setCameraPermission] = useState('unknown');

  // Timer state
  const [durationSec, setDurationSec] = useState(0);
  const timerInterval = useRef(null);

  // Voice Synthesis & Recognition states
  const [isListening, setIsListening] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [currentAnswerText, setCurrentAnswerText] = useState('');

  // TTS (Text-to-Speech) Settings
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [aiState, setAiState] = useState('idle'); // 'idle' | 'speaking' | 'listening' | 'thinking'
  const [showCaption, setShowCaption] = useState(false);

  // Evaluation Result state
  const [reportCard, setReportCard] = useState(null);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);

  // References
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  // Audio wave bars helper (simulate audio spectrum)
  const [waveHeights, setWaveHeights] = useState([15, 25, 10, 30, 20, 15, 35, 12, 28, 18]);
  const waveInterval = useRef(null);

  // Initialize Speech Recognition
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Microphone recognition is not fully supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptSegment = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptSegment;
        } else {
          interimTranscript += transcriptSegment;
        }
      }

      if (finalTranscript) {
        finalTranscriptRef.current = `${finalTranscriptRef.current} ${finalTranscript}`.trim();
      }
      setCurrentAnswerText(`${finalTranscriptRef.current} ${interimTranscript}`.trim());
    };

    rec.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
    };

    rec.onend = () => {
      setIsListening(false);
      if (aiState === 'listening') {
        setAiState('idle');
      }
    };

    rec.start();
    recognitionRef.current = rec;
    setIsListening(true);
    setAiState('listening');
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setAiState('idle');
  };

  // Text-To-Speech Synthesis helper
  const speakText = (text, callback = null) => {
    if (!window.speechSynthesis || !ttsEnabled) {
      if (callback) callback();
      return;
    }
    window.speechSynthesis.cancel();
    setAiState('speaking');

    const cleanText = text.replace(/[*#`_\-]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);

    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;

    // Check for premium natural/neural voices first
    selectedVoice = voices.find(v => v.name.toLowerCase().includes("natural") && v.lang.startsWith("en"));
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.name.toLowerCase().includes("google") && v.lang.startsWith("en"));
    }
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.name.toLowerCase().includes("apple") && v.lang.startsWith("en"));
    }
    if (!selectedVoice) {
      // Fallback to high quality standard OS voices
      const preferredNames = ["Microsoft Aria Online", "Microsoft Guy Online", "Samantha", "Daniel", "Zira", "David"];
      for (const name of preferredNames) {
        selectedVoice = voices.find(v => v.name.includes(name) && v.lang.startsWith("en"));
        if (selectedVoice) break;
      }
    }
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith("en")) || voices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Natural human cadence settings
    utterance.rate = 1.0;  // Standard conversational pacing
    utterance.pitch = 1.0; // Clear, undistorted pitch

    utterance.onend = () => {
      setAiState('idle');
      if (callback) callback();
    };

    utterance.onerror = (err) => {
      console.warn("Speech synthesis error:", err);
      setAiState('idle');
      if (callback) callback();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Start webcam feed
  const enableWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setWebcamEnabled(true);
      setCameraPermission('granted');
    } catch (err) {
      console.error("Camera permission denied or not available:", err);
      setCameraPermission('denied');
      setWebcamEnabled(false);
    }
  };

  const disableWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setWebcamEnabled(false);
  };

  // Pre-load Speech Synthesis voices and clean up media on unmount
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      // Attach dummy onvoiceschanged handler to force loading
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      disableWebcam();
      stopSpeechRecognition();
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (waveInterval.current) clearInterval(waveInterval.current);
    };
  }, []);

  // Sync webcam stream to video element when step changes
  useEffect(() => {
    if (webcamEnabled && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [step, webcamEnabled]);

  // Animate speech waves when listening
  useEffect(() => {
    if (isListening) {
      waveInterval.current = setInterval(() => {
        setWaveHeights(prev => prev.map(() => Math.floor(Math.random() * 45) + 5));
      }, 100);
    } else {
      if (waveInterval.current) clearInterval(waveInterval.current);
      setWaveHeights([10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
    }
  }, [isListening]);

  // Handle Voice Interview Initializer
  const startVoiceViva = () => {
    if (!questions || questions.length === 0) {
      alert("No project questions generated! Please regenerate questions first.");
      return;
    }
    setStep('interviewing');
    setCurrentIdx(0);
    setDurationSec(0);
    setCurrentAnswerText('');
    finalTranscriptRef.current = '';
    setUserAnswers([]);

    // Start stopwatch timer
    if (timerInterval.current) clearInterval(timerInterval.current);
    timerInterval.current = setInterval(() => {
      setDurationSec(prev => prev + 1);
    }, 1000);

    // Speak welcome prompt, then speak the first question
    const welcomePrompt = "Hello! I am Sophia, your virtual tech interviewer. I have parsed your GitHub repository. Let's start with the first question.";
    speakText(welcomePrompt, () => {
      setTimeout(() => {
        speakText(questions[0].question, () => {
          startSpeechRecognition();
        });
      }, 500);
    });

    // Proactively start camera
    enableWebcam();
  };

  // Handle saving answer and navigating next
  const handleNextQuestion = () => {
    stopSpeechRecognition();

    // Save current answer
    const currentQ = questions[currentIdx];
    const newAnswers = [
      ...userAnswers,
      {
        id: currentQ.id || currentIdx + 1,
        topic: currentQ.topic || "Core Tech",
        question: currentQ.question,
        expectedKeywords: currentQ.expectedKeywords || [],
        userAnswer: currentAnswerText.trim() || "No spoken response recorded."
      }
    ];
    setUserAnswers(newAnswers);
    const lastAnswer = currentAnswerText.trim();
    setCurrentAnswerText('');
    finalTranscriptRef.current = '';

    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);

      // Dynamic conversational transition based on response keywords
      let transitionText = "Thank you. Let's move to the next question.";
      const answerLower = lastAnswer.toLowerCase();
      if (!lastAnswer || answerLower.includes("no spoken response")) {
        transitionText = "No worries, we can proceed to the next question.";
      } else {
        const matches = (currentQ.expectedKeywords || []).filter(kw => answerLower.includes(kw.toLowerCase()));
        if (matches.length > 0) {
          transitionText = `Excellent point regarding ${matches[0]}. Let's proceed to the next question.`;
        } else {
          transitionText = "Got it, that is a clear explanation. Let's move on to the next question.";
        }
      }

      speakText(transitionText, () => {
        setTimeout(() => {
          speakText(questions[nextIdx].question, () => {
            startSpeechRecognition();
          });
        }, 500);
      });
    } else {
      // Finished all questions, compile report
      clearInterval(timerInterval.current);
      setAiState('thinking');
      const finishingText = "Excellent response! I am now compiling your interview telemetry and scoring your metrics. Please wait a moment.";
      speakText(finishingText, () => {
        submitInterviewForEvaluation(newAnswers);
      });
    }
  };

  // Submit transcripts for evaluation
  const submitInterviewForEvaluation = async (finalAnswers) => {
    setStep('submitting');
    setLoadingEvaluation(true);
    disableWebcam();

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE_URL}/api/ai/interview/evaluate`, {
        targetUsername,
        questions: finalAnswers,
        durationSeconds: durationSec
      }, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });

      if (res.data && res.data.success) {
        setReportCard(res.data.report);
        setStep('report');
      } else {
        alert("Evaluation failed. Server sent invalid response!");
        setStep('intro');
      }
    } catch (err) {
      console.error(err);
      alert("Evaluation connection failed. Please try again.");
      setStep('intro');
    } finally {
      setLoadingEvaluation(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-500 border-emerald-500/20 bg-emerald-500/5";
    if (score >= 55) return "text-amber-500 border-amber-500/20 bg-amber-500/5";
    return "text-rose-500 border-rose-500/20 bg-rose-500/5";
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div className="space-y-6 text-left">
      {step === 'intro' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
            <div className="space-y-1.5">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
                Technical Interview Room Lobby
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                Verify your video and audio settings before joining the live technical evaluation.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-slate-200 dark:border-zinc-850 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Regenerate Questions
              </button>
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 dark:text-zinc-550 italic">Compiling tailored technical inquiries...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Left Column: AI Interviewer Host */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-6 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                      <span className="text-[10px] text-slate-700 dark:text-zinc-300 font-extrabold uppercase tracking-wider">Sophia (AI Lead Interviewer)</span>
                    </div>
                    <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-650 dark:text-indigo-400 px-2 py-0.5 rounded font-mono uppercase font-bold">Host</span>
                  </div>

                  <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 flex flex-col items-center justify-center p-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 border border-indigo-400 text-white flex items-center justify-center shadow-lg">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-3">Ready to Interview</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-655 dark:text-zinc-400">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Analyzing Synced Projects & Architecture</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-655 dark:text-zinc-400">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Real-time Audio Response Evaluation</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-655 dark:text-zinc-400">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>4 Custom Technical Questions Loaded</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Candidate Device Vetting */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-6 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-3">
                    <span className="text-[10px] text-slate-700 dark:text-zinc-300 font-extrabold uppercase tracking-wider">Your Device Preview</span>
                    <span className="text-[9px] bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-650 dark:text-zinc-400 px-2 py-0.5 rounded font-mono uppercase font-bold">Developer Lobby</span>
                  </div>

                  <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 flex flex-col items-center justify-center">
                    {webcamEnabled ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center space-y-3">
                        <Video className="w-8 h-8 text-slate-600" />
                        <button
                          onClick={enableWebcam}
                          className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-bold transition shadow cursor-pointer"
                        >
                          Verify Camera Feed
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50 dark:bg-zinc-950 p-3.5 border border-slate-200/60 dark:border-zinc-900 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-indigo-500" />
                    <div className="text-left">
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider block">Audio Hardware</span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">System Microphone: Active</span>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                </div>
              </div>

              {/* Centered Join Room Action */}
              <div className="md:col-span-2 flex flex-col items-center space-y-3 pt-4">
                <button
                  onClick={startVoiceViva}
                  disabled={loading || !questions || questions.length === 0}
                  className="w-full sm:w-80 py-3.5 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-lg hover:shadow-indigo-550/20 cursor-pointer flex items-center justify-center gap-2 border border-indigo-500/20"
                >
                  <Play className="w-4 h-4 fill-current animate-pulse" />
                  {loading ? 'Preparing Interview Questions...' : 'Join Live Technical Interview'}
                </button>
                <p className="text-[10px] text-slate-400 dark:text-zinc-550 font-bold">
                  *Joining the interview will start the voice timer and webcam monitoring.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'interviewing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Interview Panel */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[550px]">
            {/* Top Control Bar */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono">REC 🔴 LIVE SESSION</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  {formatTime(durationSec)}
                </span>
                <span className="bg-zinc-800 px-3 py-1 rounded-full text-[10px] text-zinc-200">
                  Question {currentIdx + 1} of {questions.length}
                </span>
              </div>
            </div>

            {/* Voice viva state/caption card */}
            <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl space-y-4 shadow-inner">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <span className="text-[9px] text-indigo-450 font-black uppercase tracking-wider block">
                  Current Topic: {questions[currentIdx].topic || "System Design"}
                </span>
                <button
                  onClick={() => setShowCaption(!showCaption)}
                  className="px-2 py-0.5 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-250 text-[9px] font-bold rounded"
                >
                  {showCaption ? "Hide Caption" : "Show Caption"}
                </button>
              </div>

              {!showCaption ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-indigo-450 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-zinc-300">Sophia is speaking...</h4>
                    <p className="text-[10px] text-zinc-500 max-w-sm">Listen carefully and use the microphone below to reply when she finishes.</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-100 leading-relaxed font-bold tracking-wide py-4">
                  {questions[currentIdx].question}
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => speakText(questions[currentIdx].question)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-zinc-850 hover:bg-zinc-800 text-indigo-300 rounded-md text-[10px] font-bold cursor-pointer transition"
                    title="Repeat AI Interviewer voice read out"
                  >
                    <Volume2 className="w-3 h-3 text-indigo-450" /> Repeat Question
                  </button>
                  <button
                    onClick={() => setTtsEnabled(!ttsEnabled)}
                    className="p-1 bg-zinc-850 hover:bg-zinc-850 text-zinc-450 rounded-md cursor-pointer transition"
                    title={ttsEnabled ? "Mute Voice Narration" : "Unmute Voice Narration"}
                  >
                    {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-500" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Speech Telemetry and Controls */}
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              {/* Dynamic waveform representation */}
              {isListening && (
                <div className="flex items-end justify-center gap-1.5 h-12 py-2">
                  {waveHeights.map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-indigo-500 rounded-full transition-all duration-100"
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>
              )}

              <div className="relative w-28 h-28 flex items-center justify-center">
                {isListening && (
                  <>
                    <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                    <div className="absolute inset-2 bg-indigo-500/25 rounded-full animate-pulse"></div>
                  </>
                )}
                <button
                  type="button"
                  onClick={isListening ? stopSpeechRecognition : startSpeechRecognition}
                  className={`w-20 h-20 rounded-full border flex items-center justify-center shadow-lg relative z-10 transition-all cursor-pointer ${isListening
                    ? 'bg-rose-600 hover:bg-rose-500 border-rose-500 text-white scale-105 shadow-rose-500/25'
                    : 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-indigo-400 hover:text-indigo-300'
                    }`}
                >
                  {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7 animate-pulse" />}
                </button>
              </div>

              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider font-mono">
                {isListening ? "🎙️ Recording answer... Speak clearly" : "🎙️ Click mic to speak your response"}
              </span>
            </div>

            {/* Editable Response Input */}
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider">Answer Transcript (Feel free to edit or type response)</label>
              <textarea
                rows="3"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 resize-none font-normal placeholder-zinc-700 shadow-inner"
                placeholder="Your spoken words will appear here in real-time. You can also edit this box directly..."
                value={currentAnswerText}
                onChange={(e) => setCurrentAnswerText(e.target.value)}
              />
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-zinc-800 pt-4 flex justify-between items-center">
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to cancel the interview? All progress will be lost.")) {
                    setStep('intro');
                    disableWebcam();
                    stopSpeechRecognition();
                    clearInterval(timerInterval.current);
                  }
                }}
                className="px-4 py-2 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel Session
              </button>

              <button
                onClick={handleNextQuestion}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition shadow-md hover:shadow-indigo-500/10 cursor-pointer"
              >
                {currentIdx < questions.length - 1 ? "Save & Next Question" : "Finish & Evaluate"}
              </button>
            </div>
          </div>

          {/* Right Sidebar: AI Interviewer Video Feed + Proctor Feed */}
          <div className="space-y-6">
            {/* AI Interviewer Avatar Card */}
            <div className="bg-zinc-900 border border-zinc-850 rounded-3xl p-5 shadow-2xl text-left space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>

              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-xs font-black text-zinc-200 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" /> Virtual AI Interviewer
                </h3>
                <span className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                  Sophia
                </span>
              </div>

              {/* Animated Avatar Box */}
              <div className="relative aspect-video bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800/80 flex flex-col items-center justify-center p-4">
                <div className="relative">
                  {/* Dynamic Glowing Rings based on state */}
                  {aiState === 'speaking' && (
                    <div className="absolute -inset-4 bg-emerald-500/25 rounded-full animate-ping opacity-60"></div>
                  )}
                  {aiState === 'thinking' && (
                    <div className="absolute -inset-4 bg-indigo-500/25 rounded-full animate-spin opacity-50 border-t border-indigo-400"></div>
                  )}
                  {aiState === 'listening' && (
                    <div className="absolute -inset-4 bg-amber-500/25 rounded-full animate-pulse opacity-60"></div>
                  )}

                  <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-lg transition-all ${aiState === 'speaking'
                    ? 'bg-gradient-to-tr from-emerald-550 to-teal-500 border-emerald-400 text-white'
                    : aiState === 'thinking'
                      ? 'bg-gradient-to-tr from-indigo-600 to-indigo-400 border-indigo-400 text-white'
                      : aiState === 'listening'
                        ? 'bg-gradient-to-tr from-amber-600 to-orange-400 border-amber-400 text-white'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}>
                    <Bot className="w-8 h-8" />
                  </div>
                </div>

                {/* Avatar Status Overlay */}
                <div className="mt-4 flex flex-col items-center space-y-1 text-center">
                  <span className="text-[11px] font-bold text-zinc-200">
                    {aiState === 'speaking' && "Sophia is speaking..."}
                    {aiState === 'listening' && "Listening to response..."}
                    {aiState === 'thinking' && "Analyzing answers..."}
                    {aiState === 'idle' && "Sophia (Ready)"}
                  </span>
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">
                    AI Interlocutor
                  </span>
                </div>
              </div>
            </div>

            {/* Candidate Proctor Video Feed */}
            <div className="bg-zinc-900 border border-zinc-850 rounded-3xl p-5 shadow-2xl text-left space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-xs font-black text-zinc-200 flex items-center gap-2">
                  <Video className="w-4 h-4 text-indigo-400" /> Candidate Video Feed
                </h3>
                <button
                  onClick={webcamEnabled ? disableWebcam : enableWebcam}
                  className="p-1.5 bg-zinc-800 hover:bg-zinc-750 border border-zinc-750 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer"
                  title={webcamEnabled ? "Disable Camera" : "Enable Camera"}
                >
                  {webcamEnabled ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Video Feed Window */}
              <div className="relative aspect-video bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transform -scale-x-100 ${webcamEnabled ? 'block' : 'hidden'}`}
                />

                {!webcamEnabled && (
                  <div className="text-center p-4 space-y-1.5">
                    <span className="text-xl block">📷</span>
                    <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider">Candidate Camera Offline</p>
                    {cameraPermission === 'denied' && (
                      <p className="text-[8px] text-rose-500 max-w-xs mx-auto">Permission denied. Please verify camera authorization.</p>
                    )}
                  </div>
                )}

                {webcamEnabled && (
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-md text-[8px] font-bold font-mono tracking-wider uppercase flex items-center gap-1.5">
                    <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-450" /> Proctor Active
                  </div>
                )}
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-1 text-zinc-400">
                <h4 className="text-[9px] text-zinc-300 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-indigo-400" /> Gaze & Speech Proctoring
                </h4>
                <p className="text-[10px] font-normal leading-relaxed text-zinc-400">
                  Calculates horizontal gaze shift, eye contact index, vocal telemetry, WPM speed, and filler count density.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'submitting' && (
        <div className="h-96 flex flex-col items-center justify-center space-y-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-3xl shadow-sm text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <h2 className="text-base font-black text-slate-800 dark:text-zinc-200">Analyzing Answer Telemetry & Speech Cadence</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-550 max-w-sm leading-relaxed">
            Groq models are auditing code architecture accuracy while Flask analyzes vocal properties. Generating reports...
          </p>
        </div>
      )}

      {step === 'report' && reportCard && (
        <div className="space-y-6">
          {/* Header Action Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
            <div className="space-y-1.5">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                Technical Viva Report Card
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                Comprehensive performance scores, speech cadence logs, and architectural suggestions.
              </p>
            </div>

            <button
              onClick={() => setStep('intro')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition shadow-md hover:shadow-lg cursor-pointer"
            >
              <RefreshCcw className="w-4 h-4" /> Start New Interview
            </button>
          </div>

          {/* Scores Overview Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Overall Score Gauge */}
            <div className={`p-6 border rounded-2xl flex flex-col items-center justify-center text-center space-y-2 ${getScoreColor(reportCard.overallScore)}`}>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Overall Assessment Score
              </span>
              <span className="text-5xl font-black tracking-tight">{reportCard.overallScore}%</span>
              <div className="w-full bg-slate-200 dark:bg-zinc-850 h-1.5 rounded-full overflow-hidden mt-3 border border-slate-300/10">
                <div
                  className="h-full bg-indigo-550 rounded-full transition-all duration-1000"
                  style={{ width: `${reportCard.overallScore}%` }}
                ></div>
              </div>
            </div>

            {/* Score Metric Bars */}
            <div className="md:col-span-2 bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-850 p-6 rounded-2xl flex flex-col justify-center space-y-4 shadow-sm">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-750 dark:text-zinc-200">
                  <span>Technical Accuracy & Knowledge (Local ML)</span>
                  <span>{reportCard.technicalScore}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-slate-200/50 dark:border-zinc-800">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${reportCard.technicalScore}%` }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-750 dark:text-zinc-200">
                  <span>Speech Delivery & Pacing (Flask ML)</span>
                  <span>{reportCard.deliveryScore}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-slate-200/50 dark:border-zinc-800">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${reportCard.deliveryScore}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Proctoring Analytics & Speech metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* WPM & Cadence */}
            <div className="p-6 bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-850 rounded-2xl space-y-3.5 shadow-sm">
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Vocal Cadence (WPM)
              </h4>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black">{reportCard.wpm}</span>
                <span className="text-xs text-slate-500 dark:text-zinc-550 font-bold uppercase tracking-wider">Words Per Minute</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-450 font-normal leading-relaxed">
                {reportCard.wpm >= 120 && reportCard.wpm <= 150
                  ? "Great pacing! Your speech speed is within the ideal 120-150 words-per-minute range."
                  : `Your speech speed (${reportCard.wpm} WPM) is slightly outside the ideal 120-150 range. Try speaking ${reportCard.wpm < 120 ? 'faster' : 'slower'} during interviews.`}
              </p>
            </div>

            {/* Filler Words count */}
            <div className="p-6 bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-850 rounded-2xl space-y-3.5 shadow-sm">
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Verbal Fillers Analysis
              </h4>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black">{reportCard.fillerCount}</span>
                <span className="text-xs text-slate-500 dark:text-zinc-550 font-bold uppercase tracking-wider">Total fillers used</span>
              </div>

              {/* Filler breakdown pill layout */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {reportCard.fillerBreakdown && Object.entries(reportCard.fillerBreakdown).map(([word, count]) => {
                  if (count === 0) return null;
                  return (
                    <span
                      key={word}
                      className="text-[9px] bg-amber-500/10 dark:bg-amber-500/5 text-amber-650 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-md font-mono"
                    >
                      "{word}": {count}x
                    </span>
                  );
                })}
                {reportCard.fillerCount === 0 && (
                  <span className="text-[9px] bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-md font-bold uppercase">
                    Perfect! No fillers detected.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Hallucinations & identified flaws list */}
          {reportCard.hallucinationsOrFlaws && reportCard.hallucinationsOrFlaws.length > 0 && (
            <div className="p-6 bg-rose-500/5 dark:bg-rose-950/10 border border-rose-500/15 rounded-2xl space-y-3 shadow-sm">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-450 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" /> Architectural Gaps & Vulnerabilities
              </h4>
              <ul className="space-y-2 pl-4 list-disc text-xs text-slate-705 dark:text-zinc-350 leading-relaxed font-normal">
                {reportCard.hallucinationsOrFlaws.map((flaw, idx) => (
                  <li key={idx}>{flaw}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Question Breakdown Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-550 uppercase tracking-widest">
              Detailed Questions & Transcript Feedback
            </h3>

            <div className="space-y-4">
              {reportCard.questions && reportCard.questions.map((q, idx) => (
                <div key={idx} className="bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-850 p-6 rounded-2xl space-y-4 text-left shadow-sm">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-[9px] bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                      Question {idx + 1}: {q.topic || "Core Tech"}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${q.accuracy >= 80
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450"
                      : q.accuracy >= 55
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-405"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-450"
                      }`}>
                      {q.accuracy}% Accuracy
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    "{q.question}"
                  </p>

                  <div className="p-4 bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-900 rounded-xl space-y-2">
                    <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider block">Your Spoken Answer Transcript</span>
                    <p className="text-xs text-slate-700 dark:text-zinc-400 leading-relaxed font-normal">
                      "{q.userAnswer}"
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-extrabold uppercase tracking-wider block">AI Evaluator Feedback</span>
                    <p className="text-xs text-slate-700 dark:text-zinc-350 leading-relaxed font-medium">
                      {q.feedback}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockInterviewArena;
