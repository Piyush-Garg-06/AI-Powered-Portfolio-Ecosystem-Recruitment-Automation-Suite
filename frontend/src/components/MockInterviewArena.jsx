import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  RefreshCw, Key, Eye, HelpCircle, Sparkles, Mic, MicOff, 
  Volume2, VolumeX, Send, ArrowRight, Play, Square, UserCheck, MessageSquare 
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const MockInterviewArena = ({ questions, loading, onRefresh }) => {
  // Classic mode vs Live mode
  const [liveMode, setLiveMode] = useState(false);
  const [revealed, setRevealed] = useState({});

  // Chat states
  const [chatHistory, setChatHistory] = useState([]);
  const [alexMessage, setAlexMessage] = useState("");
  const [userInput, setUserInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  
  // Voice settings
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Card evaluation states
  const [answers, setAnswers] = useState({});
  const [checkedResult, setCheckedResult] = useState({});
  const [loadingCheck, setLoadingCheck] = useState({});

  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setUserInput(prev => (prev ? prev + " " + text : text));
        setIsListening(false);
      };

      rec.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleReveal = (id) => {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const checkUserAnswer = async (questionText, expectedKeywords, questionId) => {
    const answer = answers[questionId];
    if (!answer || !answer.trim()) return;

    setLoadingCheck(prev => ({ ...prev, [questionId]: true }));
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE_URL}/api/ai/interview/check`, {
        question: questionText,
        expectedKeywords: expectedKeywords,
        userAnswer: answer
      }, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });

      setCheckedResult(prev => ({ ...prev, [questionId]: res.data }));
    } catch (err) {
      console.error(err);
      alert("Evaluation failed. Please try again.");
    } finally {
      setLoadingCheck(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const resetCheckedResult = (questionId) => {
    setCheckedResult(prev => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
    setAnswers(prev => ({ ...prev, [questionId]: "" }));
  };

  // Text-To-Speech Synthesis helper
  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Remove markdown symbols before reading
    const cleanText = text.replace(/[*#`_\-]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Start Voice Capturing
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Microphone input/Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Start the interview
  const startLiveInterview = async () => {
    setLiveMode(true);
    setChatHistory([]);
    setAlexMessage("Connecting with Alex...");
    setLoadingChat(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE_URL}/api/ai/interview/chat`, 
        { history: [] },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );
      const reply = res.data.reply;
      setAlexMessage(reply);
      setChatHistory([{ role: "assistant", content: reply }]);
      if (!isMuted) {
        speakText(reply);
      }
    } catch (err) {
      console.error(err);
      setAlexMessage("Hi! I'm Alex. Let's start the technical interview. Tell me about the core challenges you solved in your repositories.");
    } finally {
      setLoadingChat(false);
    }
  };

  // Send answer to Alex
  const handleSendAnswer = async (e) => {
    if (e) e.preventDefault();
    if (!userInput.trim() && !loadingChat) return;

    const currentInput = userInput;
    setUserInput("");
    setLoadingChat(true);
    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    try {
      const token = localStorage.getItem("token");
      const updatedHistory = [...chatHistory, { role: "user", content: currentInput }];
      setChatHistory(updatedHistory);

      const res = await axios.post(`${API_BASE_URL}/api/ai/interview/chat`, 
        { history: updatedHistory },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );

      const reply = res.data.reply;
      setAlexMessage(reply);
      setChatHistory(prev => [...prev, { role: "assistant", content: reply }]);
      
      if (!isMuted) {
        speakText(reply);
      }
    } catch (err) {
      console.error(err);
      setAlexMessage("Connection interrupted. Could you please repeat that?");
    } finally {
      setLoadingChat(false);
    }
  };

  // Reset/Mute synthesis
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (alexMessage) speakText(alexMessage);
    } else {
      setIsMuted(true);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!liveMode ? (
        /* Classic mode view */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl">
            <div className="space-y-1">
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                Technical Interview Arena
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                Review custom project-specific interview questions generated by AI.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={startLiveInterview}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Live Voice Interview
              </button>
              <button
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Regenerate Questions
              </button>
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 dark:text-zinc-500 italic">Generating custom questions based on projects...</p>
            </div>
          ) : questions && questions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions.map((q, idx) => {
                const questionId = q.id || idx;
                const isRevealed = !!revealed[questionId];
                return (
                  <div 
                    key={questionId} 
                    className="p-5 bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/80 rounded-2xl flex flex-col justify-between hover:border-slate-350 dark:hover:border-zinc-700/60 transition shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          {q.topic || "Core Tech"}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-relaxed flex gap-1.5">
                        <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        {q.question}
                      </h4>
                    </div>

                    <div className="mt-5 border-t border-slate-100 dark:border-zinc-900/80 pt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-wider">
                          Expected Answer Keywords
                        </span>
                        <button
                          onClick={() => toggleReveal(questionId)}
                          className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold transition cursor-pointer"
                        >
                          {isRevealed ? (
                            <>
                              <Eye className="w-3 h-3" /> Hide Keywords
                            </>
                          ) : (
                            <>
                              <Key className="w-3 h-3" /> Reveal Keywords
                            </>
                          )}
                        </button>
                      </div>

                      {isRevealed ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {q.expectedKeywords?.map((kw, i) => (
                            <span 
                                key={i} 
                              className="text-[9px] bg-green-500/10 dark:bg-green-500/5 text-green-600 dark:text-green-400 border border-green-500/20 px-2.5 py-1 rounded-lg font-mono font-semibold"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="h-6 bg-slate-100 dark:bg-zinc-950 border border-slate-200/50 dark:border-zinc-900 rounded-lg flex items-center justify-center text-[9px] text-slate-500 dark:text-zinc-500 select-none animate-pulse">
                          Click reveal to show keywords
                        </div>
                      )}
                    </div>

                    {/* User Answer Evaluation Section */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-900/80 space-y-2">
                      <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-wider block">
                        Practice Your Answer
                      </span>

                      {!checkedResult[questionId] ? (
                        <div className="space-y-2">
                          <textarea
                            rows="2"
                            placeholder="Write your technical answer here..."
                            value={answers[questionId] || ""}
                            onChange={(e) => setAnswers(prev => ({ ...prev, [questionId]: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-slate-800 dark:focus:border-zinc-500 resize-none font-normal placeholder-slate-400 dark:placeholder-zinc-600"
                          />
                          <button
                            onClick={() => checkUserAnswer(q.question, q.expectedKeywords, questionId)}
                            disabled={loadingCheck[questionId] || !(answers[questionId] || "").trim()}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 disabled:opacity-50 text-white dark:text-zinc-950 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            {loadingCheck[questionId] ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Evaluating Answer...
                              </>
                            ) : (
                              <>Check Accuracy</>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-xl space-y-2 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-extrabold uppercase tracking-wider">Evaluation Result</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              checkedResult[questionId].accuracy >= 80 
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                                : checkedResult[questionId].accuracy >= 50 
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" 
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}>
                              {checkedResult[questionId].accuracy}% Accurate
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed font-medium">
                            {checkedResult[questionId].feedback}
                          </p>
                          <button
                            type="button"
                            onClick={() => resetCheckedResult(questionId)}
                            className="text-[9px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold transition cursor-pointer block mt-1"
                          >
                            Reset & Try Again
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-8 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs text-slate-500 dark:text-zinc-400 font-medium">
              No questions generated yet. Click the button above to generate mock interview questions!
            </div>
          )}
        </div>
      ) : (
        /* Immersive Live Avatar Voice mode view */
        <div className="bg-slate-900/90 dark:bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl">
          {/* Top Panel Controls */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono">Live Mock Interview</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Mute toggle button */}
              <button 
                onClick={toggleMute}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition cursor-pointer"
                title={isMuted ? "Unmute Voice" : "Mute Voice"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
              </button>
              
              {/* Exit button */}
              <button
                onClick={() => {
                  setLiveMode(false);
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 rounded-xl text-[10px] font-bold transition cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                Exit Live mode
              </button>
            </div>
          </div>

          {/* AI Avatar Orb Visualizer */}
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative w-44 h-44 flex items-center justify-center">
              
              {/* Pulse waves */}
              {isSpeaking && (
                <>
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" style={{ animationDuration: '2.5s' }}></div>
                  <div className="absolute inset-4 bg-indigo-500/25 rounded-full animate-ping animate-delay-300" style={{ animationDuration: '2s' }}></div>
                </>
              )}

              {isListening && (
                <>
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-pulse" style={{ animationDuration: '1.2s' }}></div>
                  <div className="absolute inset-3 bg-teal-500/25 rounded-full animate-pulse animate-delay-150" style={{ animationDuration: '1s' }}></div>
                </>
              )}

              {loadingChat && (
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-500 animate-spin" style={{ animationDuration: '8s' }}></div>
              )}

              {/* Main Avatar Center Orb */}
              <div className={`w-32 h-32 rounded-full border border-zinc-800/80 flex flex-col items-center justify-center shadow-inner transition-all duration-700 relative z-10 ${
                isSpeaking 
                  ? 'bg-gradient-to-tr from-zinc-800 to-zinc-950 scale-105 border-zinc-700 shadow-indigo-500/20' 
                  : isListening 
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 scale-105 shadow-emerald-500/30'
                    : 'bg-zinc-900 border-zinc-800'
              }`}>
                {loadingChat ? (
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                ) : isSpeaking ? (
                  <div className="flex items-end gap-1 h-6">
                    <span className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-1 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                    <span className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                ) : isListening ? (
                  <Mic className="w-7 h-7 text-white animate-pulse" />
                ) : (
                  <div className="text-center space-y-1">
                    <span className="text-2xl block">🤖</span>
                    <span className="text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase font-mono">Alex (AI)</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">
              {loadingChat ? "Alex is thinking..." : isSpeaking ? "Alex is speaking" : isListening ? "Listening... Speak now" : "Waiting for your answer"}
            </p>
          </div>

          {/* Transcript Captions display box */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-2xl min-h-24 flex flex-col justify-center space-y-2">
            <span className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-wider block">Interviewer captions</span>
            <p className="text-xs text-zinc-200 leading-relaxed font-medium">
              {alexMessage || "Greet Alex by typing or using your microphone below."}
            </p>
          </div>

          {/* User Controls: Text form + Audio mic trigger */}
          <form onSubmit={handleSendAnswer} className="flex gap-2">
            
            {/* Speech Microphone Trigger */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3.5 border rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 ${
                isListening 
                  ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white' 
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title={isListening ? "Stop Recording" : "Speak Answer"}
            >
              {isListening ? <Mic className="w-4.5 h-4.5 animate-pulse" /> : <Mic className="w-4.5 h-4.5" />}
            </button>

            {/* Text Box fallback */}
            <input
              type="text"
              placeholder={isListening ? "Microphone active... Speak your response" : "Type your answer here..."}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isListening}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-zinc-700 text-zinc-200 placeholder-zinc-600 font-normal"
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={loadingChat || !userInput.trim()}
              className="p-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white border border-indigo-600 rounded-xl flex items-center justify-center transition cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Small chat logs previews toggle */}
          {chatHistory.length > 2 && (
            <div className="border-t border-zinc-800 pt-4 space-y-2">
              <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block flex items-center gap-1 font-mono">
                <MessageSquare className="w-3.5 h-3.5" /> Recent Messages
              </span>
              <div className="max-h-24 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-zinc-800 text-left pr-2">
                {chatHistory.slice(-4).map((msg, i) => (
                  <div key={i} className="text-[10px] leading-relaxed font-normal">
                    <span className={`font-black uppercase mr-1.5 ${msg.role === 'user' ? 'text-emerald-400 font-mono' : 'text-indigo-400 font-mono'}`}>
                      {msg.role === 'user' ? 'You' : 'Alex'}:
                    </span>
                    <span className="text-zinc-400 font-medium">{msg.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MockInterviewArena;
