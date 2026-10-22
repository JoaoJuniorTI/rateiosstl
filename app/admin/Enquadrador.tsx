"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const LADO_FINAL = 1200; // a foto salva é um quadrado de no máximo 1200x1200
const ZOOM_MAX = 4;

type Props = {
  fonte: string; // URL da imagem (arquivo escolhido ou foto já cadastrada)
  aoConfirmar: (arquivo: File) => void;
  aoCancelar: () => void;
  aoFalhar: (mensagem: string) => void;
};

// Centro do recorte (em pixels da imagem original) e zoom. Não depende do tamanho do quadro na tela.
type Posicao = { cx: number; cy: number; zoom: number };

export default function Enquadrador({ fonte, aoConfirmar, aoCancelar, aoFalhar }: Props) {
  const quadro = useRef<HTMLDivElement>(null);
  const arraste = useRef<{ x: number; y: number } | null>(null);
  const [imagem, setImagem] = useState<HTMLImageElement | null>(null);
  const [lado, setLado] = useState(280);
  const [pos, setPos] = useState<Posicao>({ cx: 0, cy: 0, zoom: 1 });
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImagem(img);
      setPos({ cx: img.naturalWidth / 2, cy: img.naturalHeight / 2, zoom: 1 });
    };
    img.onerror = () => aoFalhar("Não consegui abrir essa imagem. Tente outra (JPG, PNG ou WebP).");
    img.src = fonte;
  }, [fonte]);

  useLayoutEffect(() => {
    if (quadro.current) setLado(quadro.current.getBoundingClientRect().width);
  }, [imagem]);

  if (!imagem) return <div className="enquadrador-quadro carregando">Carregando…</div>;

  const w = imagem.naturalWidth;
  const h = imagem.naturalHeight;
  const escalaDe = (zoom: number) => (lado / Math.min(w, h)) * zoom;

  // Mantém o quadro sempre coberto pela imagem.
  function limitar(p: Posicao): Posicao {
    const meio = lado / 2 / escalaDe(p.zoom);
    return {
      zoom: p.zoom,
      cx: Math.min(Math.max(p.cx, meio), w - meio),
      cy: Math.min(Math.max(p.cy, meio), h - meio),
    };
  }

  const escala = escalaDe(pos.zoom);

  function mover(e: React.PointerEvent) {
    if (!arraste.current) return;
    const dx = e.clientX - arraste.current.x;
    const dy = e.clientY - arraste.current.y;
    arraste.current = { x: e.clientX, y: e.clientY };
    setPos((p) => limitar({ ...p, cx: p.cx - dx / escalaDe(p.zoom), cy: p.cy - dy / escalaDe(p.zoom) }));
  }

  async function confirmar() {
    if (!imagem) return;
    setGerando(true);
    try {
      const recorte = Math.min(w, h) / pos.zoom; // lado do recorte em pixels da imagem original
      const saida = Math.min(LADO_FINAL, Math.round(recorte));
      const canvas = document.createElement("canvas");
      canvas.width = saida;
      canvas.height = saida;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(imagem, pos.cx - recorte / 2, pos.cy - recorte / 2, recorte, recorte, 0, 0, saida, saida);
      const gerar = (tipo: string) => new Promise<Blob | null>((ok) => canvas.toBlob(ok, tipo, 0.85));
      let blob = await gerar("image/webp");
      if (!blob || blob.type !== "image/webp") blob = await gerar("image/jpeg");
      if (!blob) throw new Error();
      const extensao = blob.type === "image/webp" ? "webp" : "jpg";
      aoConfirmar(new File([blob], `foto.${extensao}`, { type: blob.type }));
    } catch {
      aoFalhar("Não foi possível processar a foto.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="enquadrador">
      <div
        ref={quadro}
        className="enquadrador-quadro"
        onPointerDown={(e) => {
          arraste.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={mover}
        onPointerUp={() => (arraste.current = null)}
        onPointerCancel={() => (arraste.current = null)}
      >
        <img
          src={imagem.src}
          alt=""
          draggable={false}
          style={{
            width: w * escala,
            height: h * escala,
            left: lado / 2 - pos.cx * escala,
            top: lado / 2 - pos.cy * escala,
          }}
        />
      </div>
      <p className="dica">Arraste a foto para escolher a parte que aparece no card.</p>
      <label className="enquadrador-zoom">
        <span>Zoom</span>
        <input
          type="range"
          min={1}
          max={ZOOM_MAX}
          step={0.01}
          value={pos.zoom}
          onChange={(e) => setPos((p) => limitar({ ...p, zoom: Number(e.target.value) }))}
        />
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="botao" style={{ flex: 1 }} onClick={confirmar} disabled={gerando}>
          {gerando ? "Preparando…" : "Usar este enquadramento"}
        </button>
        <button type="button" className="botao secundario" onClick={aoCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
