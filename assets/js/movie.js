document.addEventListener('DOMContentLoaded', () => {
    // Navigation transparent on scroll
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(2, 6, 23, 0.9)'; 
        } else {
            header.style.background = 'var(--glass-bg)';
        }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            window.location.href = `index.html?search=${encodeURIComponent(searchInput.value)}`;
        }
    });

    if (!slug) {
        window.location.href = 'index.html';
        return;
    }

    loadMovieDetail(slug);
});

async function loadMovieDetail(slug) {
    const movieLoader = document.getElementById('movieLoader');
    const movieContent = document.getElementById('movieContent');
    
    const data = await VSAPI.getMovieDetail(slug);
    
    if (data && data.status) {
        const movie = data.movie;
        const episodes = data.episodes; // Array of server sources (often vsmov provides them here)
        
        // Render Details
        document.title = `${movie.name} - GayPhim`;
        
        document.getElementById('detailTitle').textContent = movie.name;
        document.getElementById('detailOriginalTitle').textContent = movie.origin_name;
        
        let desc = 'Đang cập nhật nội dung...';
        if (typeof movie.content === 'string') {
            desc = movie.content.replace(/<[^>]*>?/gm, '');
        }
        document.getElementById('detailDesc').textContent = desc;

        const safeImageUrl = (url) => {
            if (typeof url !== 'string' || url.length < 5) return 'https://phimimg.com/upload/vod/20230303-1/c2763dfef33b0036ee7bfeb6f2bdee5b.jpg';
            if (url.startsWith('http')) return url;
            return `https://phimimg.com/${url}`;
        };
        
        document.getElementById('detailPoster').src = safeImageUrl(movie.thumb_url);
        document.getElementById('detailBackdrop').style.backgroundImage = `url('${safeImageUrl(movie.poster_url || movie.thumb_url)}')`;

        // Tags
        const tagsContainer = document.getElementById('detailTags');
        tagsContainer.innerHTML = `
            <span>${movie.quality || 'HD'}</span>
            <span>${movie.lang || 'Vietsub'}</span>
        `;
        if (movie.category && movie.category.length > 0) {
            movie.category.forEach(c => {
                tagsContainer.innerHTML += `<span>${c.name}</span>`;
            });
        }

        // Meta text
        document.getElementById('detailYear').textContent = movie.year || 'Đang cập nhật';
        document.getElementById('detailTime').textContent = movie.time || 'Đang cập nhật';
        document.getElementById('detailQuality').textContent = `${movie.quality || ''} ${movie.lang || ''}`;
        
        // Format Map Arrays
        const mapItems = (arr) => arr && arr.length > 0 ? arr.map(i => i.name).join(', ') : 'Đang cập nhật';
        
        document.getElementById('detailCountry').textContent = mapItems(movie.country);
        
        // Sometimes directors/actors are simple arrays of strings depending on exact API format
        const mapStrings = (arr) => {
            if(!arr || arr.length === 0) return 'Đang cập nhật';
            if(typeof arr[0] === 'string') return arr.join(', ');
            return arr.map(i => i.name).join(', ');
        }

        document.getElementById('detailDirector').textContent = mapStrings(movie.director);
        document.getElementById('detailActors').textContent = mapStrings(movie.actor);

        // Render Episodes
        if (episodes && episodes.length > 0) {
            document.querySelector('.player-container').style.display = 'block';
            renderEpisodes(episodes);
        } else {
            document.querySelector('.player-container').style.display = 'none';
            document.getElementById('episodesWrapper').innerHTML = '<p style="color:var(--accent-color); font-weight: bold;"><i class="fas fa-exclamation-triangle"></i> Rất tiếc! Phim này hiện tại hệ thống chưa kéo được link xem, hoặc bộ chia link (VSMov/Ophim) chưa cập nhật video gốc. Vui lòng quay lại sau!</p>';
        }

        // Show content
        movieLoader.style.display = 'none';
        movieContent.style.display = 'block';
    } else {
        alert("Không tải được chi tiết phim!");
        // window.location.href = 'index.html';
    }
}

function renderEpisodes(servers) {
    const wrapper = document.getElementById('episodesWrapper');
    const playerContainer = document.querySelector('.player-container');
    wrapper.innerHTML = '';
    
    if (!servers || servers.length === 0) {
        wrapper.innerHTML = '<p>Phim mới, hiện tại hệ thống chưa cập nhật bản xem phim. Vui lòng quay lại sau...</p>';
        if (playerContainer) playerContainer.style.display = 'none';
        return;
    } else {
        if (playerContainer) playerContainer.style.display = 'block';
    }

    let firstLink = null;

    servers.forEach((server, serverIndex) => {
        const serverDiv = document.createElement('div');
        serverDiv.style.marginBottom = '2rem';
        
        const serverTitle = document.createElement('h4');
        serverTitle.textContent = `Server: ${server.server_name}`;
        serverTitle.style.marginBottom = '1rem';
        serverTitle.style.color = 'var(--text-secondary)';
        serverDiv.appendChild(serverTitle);

        const epsGrid = document.createElement('div');
        epsGrid.className = 'episode-grid';

        server.server_data.forEach((ep, epIndex) => {
            const btn = document.createElement('button');
            btn.className = 'episode-btn';
            btn.textContent = ep.name;
            
            btn.addEventListener('click', () => {
                // Update active state across all buttons
                document.querySelectorAll('.episode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Play
                playEpisode(ep.link_m3u8, ep.link_embed); // sometimes ophim gives embed link instead
            });
            
            // Set first button active
            if (serverIndex === 0 && epIndex === 0) {
                btn.classList.add('active');
                firstLink = ep; // Save the whole episode object
            }

            epsGrid.appendChild(btn);
        });

        serverDiv.appendChild(epsGrid);
        wrapper.appendChild(serverDiv);
    });

    // Auto play first link
    if (firstLink) {
        playEpisode(firstLink.link_m3u8, firstLink.link_embed);
    }
}

function playEpisode(m3u8, embed) {
    const player = document.getElementById('videoPlayer');
    // Bắt buộc dùng lại link embed vì Server chặn luồng xem trực tiếp ở trang ngoài
    if (embed) {
        player.src = embed;
    } else {
        console.warn("Không có link nhúng, buộc phải dùng HLS m3u8 (dễ bị chặn):", m3u8);
        player.src = m3u8;
    }
    
    // Scroll to player smoothly
    document.querySelector('.player-container').scrollIntoView({behavior: 'smooth', block: 'center'});
}
