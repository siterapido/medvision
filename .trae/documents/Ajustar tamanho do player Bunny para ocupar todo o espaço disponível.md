## Objetivo
Garantir que o player de vídeos do Bunny (mediadelivery/b-cdn) ocupe 100% da largura do container de vídeo e mantenha uma altura proporcional adequada, evitando players visivelmente pequenos.

## Estratégia
1. Substituir o wrapper atual por um container responsivo controlado diretamente via CSS utilitário:
   - Usar um container `relative w-full` com um placeholder de razão (`pb-[56.25%]` para 16:9) e um filho `absolute inset-0` para o `<iframe>` ou `<video>`.
   - Adicionar `min-h-[360px]` ao wrapper para evitar alturas pequenas em telas estreitas.
2. Garantir que o `<iframe>` do Bunny ocupe todo o espaço do wrapper:
   - `className="w-full h-full"`, `frameBorder="0"`, `allowFullScreen`, `playsInline`, `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"`.
3. Ajustar o `<video>` local (MP4/M3U8) para preencher bem sem distorcer:
   - `className="w-full h-full object-contain"` para evitar cortes.
4. Manter a detecção existente de domínios (`mediadelivery.net`/`b-cdn.net`) e usar `<iframe>` para eles.
5. Opcional: Tornar a razão de aspecto configurável por aula (ex.: `lesson.aspect_ratio`), fallback para 16:9.

## Implementação
- Alterar `components/courses/course-player.tsx` na seção do player de vídeo:
  - Substituir o uso de `AspectRatio` por:
    ```tsx
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-black">
      <div className="relative w-full min-h-[360px]">
        <div className="pb-[56.25%]" />
        <div className="absolute inset-0">
          {hasLessons && normalizedVideoUrl ? (
            isVideoFile(normalizedVideoUrl) ? (
              <video src={normalizedVideoUrl} className="w-full h-full object-contain" controls />
            ) : (
              <iframe
                src={normalizedVideoUrl}
                title={currentLesson?.title ?? "Vídeo do curso"}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                frameBorder="0"
              />
            )
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-300">Nenhuma aula com vídeo disponível.</div>
          )}
        </div>
      </div>
    </div>
    ```
- Referências de onde alterar: `components/courses/course-player.tsx:472-499`.

## Validação
- Abrir um curso com vídeo Bunny `mediadelivery.net` e verificar:
  - Player ocupa toda a largura do container central.
  - Altura proporcional (16:9) e não fica pequeno.
  - Sem barras/scroll dentro do iframe.
- Testar também um vídeo `.mp4` para confirmar o preenchimento com `object-contain`.

## Observações
- Caso alguns vídeos tenham outra proporção (ex.: 4:3), posso adicionar suporte a ratios por aula. Por ora, 16:9 cobre os cenários mais comuns do Bunny.