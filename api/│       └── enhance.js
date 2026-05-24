export const config = {
  api: { bodyParser: { sizeLimit: "15mb" } },
};

const MODELS = {
  upscale:    "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
  denoise:    "tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3",
  portrait:   "tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3",
  background: "stability-ai/stable-diffusion-img2img:15a3689ee13b0d2616e98820eca31d4af4a0e80d1271a1abc23d37b6d14ca7af",
  light:      "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
  auto:       "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
};

const BG_PROMPTS = {
  studio:  "pure white seamless studio background, professional product photography",
  sunset:  "beautiful warm sunset gradient, orange and pink sky, dreamy atmosphere",
  nature:  "lush green nature, fresh leaves, natural sunlight, bokeh background",
  luxury:  "dark luxury background, deep navy, elegant premium feel",
  ocean:   "vibrant blue ocean, clear water, bright modern feel",
  pastel:  "soft pastel pink, feminine, delicate, airy clean background",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
  if (!REPLICATE_API_KEY || REPLICATE_API_KEY.includes("ҚОЙЫҢЫЗ")) {
    return res.status(500).json({ error: "Replicate API key қойылмаған!" });
  }

  try {
    const { imageBase64, mode, bgStyle } = req.body;
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageDataUrl = `data:image/png;base64,${base64Data}`;
    const model = MODELS[mode] || MODELS.auto;

    let input = {};
    if (mode === "background") {
      input = {
        image: imageDataUrl,
        prompt: BG_PROMPTS[bgStyle] || BG_PROMPTS.studio,
        negative_prompt: "blurry, low quality, distorted",
        image_strength: 0.4,
        num_inference_steps: 30,
      };
    } else if (mode === "denoise" || mode === "portrait") {
      input = { img: imageDataUrl, version: 1.4, scale: 2 };
    } else {
      input = { image: imageDataUrl, scale: 2, face_enhance: false };
    }

    const predRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ version: model.split(":")[1], input }),
    });

    if (!predRes.ok) {
      const err = await predRes.text();
      return res.status(500).json({ error: "Replicate қатесі: " + err });
    }

    const prediction = await predRes.json();

    // Нәтижені күту
    let output = null;
    for (let i = 0; i < 60; i++) {
      await sleep(2000);
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { Authorization: `Token ${REPLICATE_API_KEY}` },
      });
      const pollData = await poll.json();
      if (pollData.status === "succeeded") {
        output = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
        break;
      }
      if (pollData.status === "failed") {
        return res.status(500).json({ error: "AI өңдеу сәтсіз: " + (pollData.error || "белгісіз қате") });
      }
    }

    if (!output) return res.status(500).json({ error: "Уақыт аяқталды, қайта көріңіз" });
    return res.status(200).json({ success: true, imageUrl: output });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
