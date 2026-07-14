import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlockMath } from 'react-katex';
import { Upload, Send, Cpu, Image as ImageIcon, Trash2 } from 'lucide-react';
import 'katex/dist/katex.min.css';

export default function App() {
  const [input, setInput] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  // 處理圖片上傳轉 Base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result); // Base64
        setImagePreview(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview('');
  };

  // 呼叫 Groq API 進行數學解析
  const solveMath = async () => {
    if (!input.trim() && !image) return;
    setLoading(true);
    setResult(null);

    const API_KEY = import.meta.env.VITE_GROQ_API_KEY; 

    // 🔥 強大的系統防護護欄，拒絕非數學問題
    const systemPrompt = `You are a world-class Mathematical AI Engine. 
    CRITICAL SECURITY RULE: You can ONLY solve math, physics, or highly logical problems. 
    If the user's input (text or image) is NOT a math-related problem (e.g., general chatting, programming questions, history, jokes, casual greetings, etc.), you MUST reject it completely.

    You MUST return ONLY a strict JSON object.

    IF the input IS a math problem, return this format:
    {
      "problem_restatement": "Restated math problem in LaTeX",
      "steps": ["Step 1 explanation \\\\(LaTeX formula\\\\)", "Step 2..."],
      "final_answer": "Final LaTeX answer only"
    }

    IF the input is NOT a math problem, you MUST return exactly this JSON to simulate a system firewall block:
    {
      "problem_restatement": "\\\\text{SYSTEM_WARNING: Non-Mathematical Query Detected}",
      "steps": ["錯誤代碼 0x4F：偵測到非數學或數理邏輯相關的無效指令。", "本量子引擎算力僅限用於高等數學、微積分與物理演算法。", "連線請求已被防火牆主動攔截並阻斷。"],
      "final_answer": "\\\\text{ACCESS_DENIED}"
    }
    
    Do not use Markdown blocks (\`\`\`) outside the JSON. Return pure JSON.`;

    try {
      if (!API_KEY) throw new Error("API Key 未設定 (請檢查環境變數)");

      let messages = [{ role: "system", content: systemPrompt }];
      let model = "llama-3.3-70b-versatile";

      if (image) {
        // 若有圖片，切換到 Groq 的視覺模型
        model = "llama-3.2-11b-vision-preview";
        messages.push({
          role: "user",
          content: [
            { type: "text", text: input || "請詳細解答這張圖片中的數學題目。" },
            { type: "image_url", image_url: { url: image } }
          ]
        });
      } else {
        messages.push({ role: "user", content: input });
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.1, // 數學需要極低隨機性
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // 解析 JSON
      const parsedData = JSON.parse(content.trim());
      setResult(parsedData);

    } catch (error) {
      console.error("解題失敗:", error);
      // 🔥 修改處：直接在頁面上顯示具體錯誤原因，方便你在手機端除錯
      setResult({
        problem_restatement: "\\text{SYSTEM_ERROR_DEBUG}",
        steps: [
          "量子計算矩陣連線異常。",
          `錯誤細節: ${error.message}`,
          "請檢查 Render 環境變數 VITE_GROQ_API_KEY 是否設定正確。"
        ],
        final_answer: "\\text{Check_Logs}"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 font-sans selection:bg-cyber-neon selection:text-black flex flex-col max-w-5xl mx-auto">
      
      {/* 頂部標題 */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex items-center gap-4 mb-12"
      >
        <div className="p-3 bg-cyber-neon/10 rounded-xl border border-cyber-neon/50 shadow-neon">
          <Cpu className="text-cyber-neon w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-cyber-neon">
            QUANTUM MATH ENGINE
          </h1>
          <p className="text-gray-400 text-sm tracking-widest mt-1">SYMBOLIC COMPUTATION & VISION AI</p>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 左側：輸入控制台 */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="glass-panel p-6 flex flex-col gap-6"
        >
          <div className="text-cyber-neon text-sm font-bold tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-cyber-neon rounded-full animate-pulse"></span>
            INPUT_TERMINAL
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="輸入數學難題 (如: 求解積分 \int x^2 dx)..."
            className="w-full h-40 bg-black/50 border border-gray-800 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyber-neon/70 focus:shadow-neon transition-all resize-none custom-scrollbar"
          />

          {/* 圖片預覽區 */}
          <AnimatePresence>
            {imagePreview && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, height: 0 }} 
                animate={{ scale: 1, opacity: 1, height: "auto" }} 
                exit={{ scale: 0.9, opacity: 0, height: 0 }}
                className="relative rounded-xl overflow-hidden border border-cyber-neon/40 shadow-neon group bg-black"
              >
                <img src={imagePreview} alt="Target" className="w-full h-48 object-contain" />
                {loading && <div className="scanner-line"></div>}
                <motion.button 
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-2 bg-red-500/80 backdrop-blur rounded-full text-white hover:bg-red-500 transition-colors z-20"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4 mt-auto">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            
            {/* 上傳圖片按鈕 */}
            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(0,240,255,0.4)" }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border border-gray-700 bg-gray-900 hover:border-cyber-neon/50 text-gray-300 hover:text-cyber-neon transition-colors font-medium tracking-wider"
            >
              <ImageIcon className="w-5 h-5" /> 分析圖片
            </motion.button>

            {/* 啟動運算按鈕 */}
            <motion.button 
              whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(0,240,255,0.6)" }} 
              whileTap={{ scale: 0.95 }}
              onClick={solveMath}
              disabled={loading}
              className={`flex-[2] flex items-center justify-center gap-2 py-4 rounded-xl bg-cyber-neon text-black font-bold tracking-widest uppercase ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white transition-colors'}`}
            >
              {loading ? (
                <span className="animate-pulse flex items-center gap-2">
                  <Cpu className="w-5 h-5 animate-spin" /> 運算中...
                </span>
              ) : (
                <><Send className="w-5 h-5" /> 執行解題</>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* 右側：解析結果輸出 */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          className="glass-panel p-6 flex flex-col gap-6 relative overflow-hidden min-h-[500px]"
        >
          <div className="text-cyber-neon text-sm font-bold tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-cyber-neon rounded-full"></span>
            OUTPUT_ANALYSIS
          </div>

          {!result && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
              <Cpu className="w-16 h-16 mb-4 opacity-20" />
              <p className="tracking-widest text-sm text-center">等待數據輸入...<br/><span className="text-xs opacity-50 mt-2 block">支援圖片辨識與 LaTeX 語法</span></p>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-cyber-neon/20 border-t-cyber-neon rounded-full animate-spin mb-4"></div>
              <p className="text-cyber-neon animate-pulse tracking-widest text-sm">正在建構解題神經矩陣...</p>
            </div>
          )}

          <AnimatePresence>
            {result && !loading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-2"
              >
                {/* 題目重述 */}
                <div className="bg-white/5 p-4 rounded-xl border border-gray-700">
                  <span className="text-xs text-gray-400 block mb-2 tracking-widest uppercase">Target Equation</span>
                  <div className="text-lg overflow-x-auto pb-2 custom-scrollbar text-cyber-neon">
                    <BlockMath math={result.problem_restatement || ""} />
                  </div>
                </div>

                {/* 步驟推導 */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs text-cyber-neon tracking-widest uppercase">Logical Derivation</span>
                  {result.steps.map((step, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.15 }}
                      whileHover={{ x: 5, backgroundColor: "rgba(0, 240, 255, 0.05)" }}
                      className="p-4 bg-gray-900/50 rounded-lg border-l-2 border-cyber-neon/50 text-sm md:text-base leading-relaxed cursor-default transition-all"
                    >
                      <span className="text-cyber-neon font-bold mr-2">[{index + 1}]</span>
                      {step}
                    </motion.div>
                  ))}
                </div>

                {/* 最終解答 */}
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: result.steps.length * 0.15 + 0.2 }}
                  className="mt-auto p-6 bg-cyber-neon/10 border border-cyber-neon rounded-xl shadow-neon text-center relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-cyber-neon/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                  <span className="text-xs text-cyber-neon block mb-2 tracking-widest uppercase">Final Result</span>
                  <div className="text-2xl font-bold text-white overflow-x-auto pb-2 custom-scrollbar relative z-10">
                    <BlockMath math={result.final_answer || ""} />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
