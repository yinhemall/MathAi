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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setImagePreview(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview('');
  };

  const solveMath = async () => {
    if (!input.trim() && !image) return;
    setLoading(true);
    setResult(null);

    // 這裡讀取環境變數，如果部署沒讀到，這裡會是 undefined
    const API_KEY = import.meta.env.VITE_GROQ_API_KEY; 

    const systemPrompt = `You are a world-class Mathematical AI Engine. 
    Return ONLY a strict JSON object with: "problem_restatement", "steps" (array), "final_answer".`;

    try {
      if (!API_KEY) throw new Error("API Key 未設定 (VITE_GROQ_API_KEY missing)");

      let messages = [{ role: "system", content: systemPrompt }];
      let model = "llama3-70b-8192";

      if (image) {
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
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      setResult(JSON.parse(content.trim()));

    } catch (error) {
      console.error("解題失敗:", error);
      setResult({
        problem_restatement: "\\text{SYSTEM_DEBUG_MODE}",
        steps: [
          "量子計算矩陣無法回應。",
          `錯誤細節: ${error.message}`,
          "請確認 API Key 是否有效且額度充足。"
        ],
        final_answer: "\\text{CONNECTION_FAILED}"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 font-sans selection:bg-cyber-neon selection:text-black flex flex-col max-w-5xl mx-auto">
      <header className="flex items-center gap-4 mb-12">
        <div className="p-3 bg-cyber-neon/10 rounded-xl border border-cyber-neon/50 shadow-neon">
          <Cpu className="text-cyber-neon w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-cyber-neon">
            QUANTUM MATH ENGINE
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6 flex flex-col gap-6">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="輸入數學題目..."
            className="w-full h-40 bg-black/50 border border-gray-800 rounded-xl p-4 text-white"
          />
          <div className="flex gap-4">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-4 border rounded-xl">分析圖片</button>
            <button onClick={solveMath} disabled={loading} className="flex-[2] py-4 bg-cyber-neon text-black font-bold rounded-xl">執行解題</button>
          </div>
        </div>

        <div className="glass-panel p-6 min-h-[500px]">
          {result && (
            <div className="flex flex-col gap-6">
              <BlockMath math={result.problem_restatement || ""} />
              {result.steps?.map((step, i) => <p key={i}>{step}</p>)}
              <BlockMath math={result.final_answer || ""} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
