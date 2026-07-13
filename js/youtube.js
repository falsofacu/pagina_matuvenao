// YouTube: trae los últimos videos del canal automáticamente usando la
// YouTube Data API v3. Necesita channelId + apiKey en data/config.json.
// Sin esos datos, muestra el embed del canal como respaldo.
// Se muestra la miniatura en alta resolución (no el iframe) y recién se
// carga el video real al hacer clic — así se evita el logo de YouTube
// tapando la miniatura y la calidad inconsistente del embed automático.
// Los Shorts se descartan por duración: YouTube permite Shorts de hasta
// 3 minutos, así que cualquier video de esa duración o menos se excluye.
(function () {
  const wrap = document.getElementById('youtubeList');
  const channelLink = document.getElementById('youtubeChannelLink');
  const DURACION_MAX_SHORT = 180; // segundos

  function parseDuracionISO8601(duracion) {
    // Ej: "PT1M32S" -> 92 segundos
    const match = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(duracion || '');
    const horas = parseInt(match?.[1] || '0', 10);
    const minutos = parseInt(match?.[2] || '0', 10);
    const segundos = parseInt(match?.[3] || '0', 10);
    return horas * 3600 + minutos * 60 + segundos;
  }

  function miniaturaAlta(videoId) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // YouTube devuelve un placeholder gris de 120x90 cuando no existe maxresdefault
        const esPlaceholder = img.naturalWidth === 120 && img.naturalHeight === 90;
        resolve(esPlaceholder ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : img.src);
      };
      img.onerror = () => resolve(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
      img.src = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    });
  }

  function activarReproduccion(item, videoId, title) {
    item.querySelector('.yt-thumb').addEventListener('click', () => {
      const thumb = item.querySelector('.yt-thumb');
      thumb.outerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" title="${title}" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
    });
  }

  fetch('data/config.json')
    .then((r) => r.json())
    .then((cfg) => {
      const yt = cfg.youtube || {};
      channelLink.href = yt.channelUrl || '#';

      const listo = yt.channelId && yt.apiKey &&
        !yt.channelId.startsWith('PONER_') && !yt.apiKey.startsWith('PONER_');

      if (!listo) {
        wrap.innerHTML = `
          <div class="youtube-item glass" style="grid-column:1/-1">
            <iframe src="https://www.youtube.com/embed?listType=user_uploads&list=${yt.channelId || ''}"
              title="Canal de YouTube" allowfullscreen></iframe>
          </div>`;
        return;
      }

      const base = 'https://www.googleapis.com/youtube/v3';
      const maxResults = yt.maxResults || 6;
      // Pedimos de más porque después descartamos los Shorts.
      const pedidos = Math.min(maxResults * 3, 50);

      fetch(`${base}/channels?part=contentDetails&id=${yt.channelId}&key=${yt.apiKey}`)
        .then((r) => r.json())
        .then((data) => {
          const uploadsId = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
          if (!uploadsId) throw new Error('sin playlist');
          return fetch(
            `${base}/playlistItems?part=snippet&maxResults=${pedidos}&playlistId=${uploadsId}&key=${yt.apiKey}`
          );
        })
        .then((r) => r.json())
        .then(async (data) => {
          const items = data.items || [];
          if (!items.length) throw new Error('sin videos');

          const videoIds = items.map((it) => it.snippet.resourceId.videoId).join(',');
          const detalle = await fetch(`${base}/videos?part=contentDetails&id=${videoIds}&key=${yt.apiKey}`).then((r) =>
            r.json()
          );
          const duraciones = {};
          (detalle.items || []).forEach((v) => {
            duraciones[v.id] = parseDuracionISO8601(v.contentDetails.duration);
          });

          const videos = items
            .filter((it) => {
              const id = it.snippet.resourceId.videoId;
              const duracion = duraciones[id] || 0;
              const esShort = duracion > 0 && duracion <= DURACION_MAX_SHORT;
              return !esShort;
            })
            .slice(0, maxResults);

          if (!videos.length) throw new Error('sin videos largos');

          const miniaturas = await Promise.all(
            videos.map((it) => miniaturaAlta(it.snippet.resourceId.videoId))
          );

          wrap.innerHTML = videos
            .map((it, i) => {
              const title = it.snippet.title;
              return `
              <div class="youtube-item glass">
                <div class="yt-thumb" style="background-image:url('${miniaturas[i]}')">
                  <button class="yt-play" aria-label="Reproducir ${title}">&#9658;</button>
                </div>
                <div class="yt-title">${title}</div>
              </div>`;
            })
            .join('');

          [...wrap.querySelectorAll('.youtube-item')].forEach((item, i) => {
            activarReproduccion(item, videos[i].snippet.resourceId.videoId, videos[i].snippet.title);
          });
        })
        .catch(() => {
          wrap.innerHTML = '<p class="loading">No se pudieron cargar los videos.</p>';
        });
    })
    .catch(() => {
      wrap.innerHTML = '<p class="loading">No se pudo cargar la configuración de YouTube.</p>';
    });
})();
