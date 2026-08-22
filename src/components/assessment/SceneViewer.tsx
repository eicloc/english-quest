"use client";

import Image from "next/image";
import { useState } from "react";
import type { SceneAsset } from "@/features/assessment/types";
import { withBasePath } from "@/lib/base-path";

export function SceneViewer({ scene, debug = false, disabled = false, targetHotspotId, selectedHotspotId, answerRevealed = false, onSelect, onBlank }: { scene: SceneAsset; debug?: boolean; disabled?: boolean; targetHotspotId?: string; selectedHotspotId?: string; answerRevealed?: boolean; onSelect: (hotspotId: string) => void; onBlank: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showFallback = !scene.imageSrc || imageFailed;
  const imageSrc = scene.imageSrc;
  return (
    <div className="relative mx-auto aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-[28px] border-4 border-white bg-sky-100 shadow-xl" onClick={() => !disabled && onBlank()} role="group" aria-label={scene.alt}>
      {!showFallback && imageSrc && <Image src={withBasePath(imageSrc)} alt={scene.alt} fill sizes="(max-width: 900px) 100vw, 900px" className="object-cover" onError={() => setImageFailed(true)} priority />}
      {showFallback && <FallbackScene kind={scene.kind} />}
      {scene.hotspots.map((hotspot) => {
        const revealed = answerRevealed && hotspot.id === targetHotspotId;
        const selectedIncorrect = selectedHotspotId === hotspot.id && hotspot.id !== targetHotspotId;
        return <button key={hotspot.id} type="button" disabled={disabled} aria-label={hotspot.label} onClick={(event) => { event.stopPropagation(); if (!disabled) onSelect(hotspot.id); }} className={`absolute rounded-xl transition ${debug ? "border-2 border-dashed border-fuchsia-500 bg-fuchsia-300/15" : "border-0 bg-transparent"} ${revealed ? "animate-pulse ring-4 ring-emerald-400 ring-offset-2" : selectedIncorrect ? "ring-4 ring-rose-400 ring-offset-2" : ""}`} style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%`, width: `${hotspot.width}%`, height: `${hotspot.height}%` }}><span className="sr-only">{hotspot.label}</span>{showFallback && <span className="grid size-full place-items-center text-[clamp(1.2rem,4vw,3.3rem)] drop-shadow-sm" aria-hidden="true">{hotspot.emoji}</span>}</button>;
      })}
      {debug && <span className="absolute bottom-2 left-2 rounded-full bg-fuchsia-700 px-3 py-1 text-xs font-black text-white">热点调试</span>}
    </div>
  );
}

function FallbackScene({ kind }: { kind: SceneAsset["kind"] }) {
  if (kind === "classroom") return <div className="scene-grid absolute inset-0 bg-[#FFF8E7]"><div className="absolute inset-x-0 bottom-0 h-[28%] bg-[#D6B38A]" /><div className="absolute left-[4%] top-[18%] h-[47%] w-[14%] rounded-t-xl bg-[#B98A62]" /><div className="absolute right-[7%] top-[9%] h-[29%] w-[21%] rounded-xl border-[8px] border-white bg-[#CDEEFF]" /><div className="absolute left-[33%] top-[53%] h-[21%] w-[35%] rounded-xl bg-[#C58B5A] shadow-lg" /></div>;
  return <div className="absolute inset-0 bg-[#CDEEFF]"><div className="absolute inset-x-0 bottom-0 h-[62%] bg-[#BCE6A9]" /><div className="absolute bottom-[4%] right-[4%] h-[19%] w-[30%] rounded-[50%] bg-[#8CD5E8] ring-4 ring-white/50" /><div className="absolute left-[8%] top-[22%] h-[42%] w-[14%] rounded-[50%] bg-[#79C267]" /></div>;
}
