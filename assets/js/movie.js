document.addEventListener('DOMContentLoaded', () => {
    // Navigation transparent on scroll
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Dropdown toggle on click
    const dropbtn = document.querySelector('.dropbtn');
    const dropdown = document.querySelector('.dropdown');
    const dropIcon = dropbtn.querySelector('i');
    
    dropbtn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent document click from immediately closing it
        dropdown.classList.toggle('show');
        dropIcon.classList.toggle('rotate');
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
            dropIcon.classList.remove('rotate');
        }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    const searchInput = document.getElementById('searchInput');
    const suggestionsBox = document.getElementById('searchSuggestions');
    let suggestTimeout;

    const hideSuggestions = () => {
        suggestionsBox.classList.remove('visible');
    };

    const getSafeThumb = (url) => {
        if (typeof url !== 'string' || url.length < 5) return 'https://phimimg.com/upload/vod/20230303-1/c2763dfef33b0036ee7bfeb6f2bdee5b.jpg';
        if (url.startsWith('http')) return url;
        return `https://phimimg.com/${url}`;
    };

    const showSuggestions = (items, query) => {
        suggestionsBox.innerHTML = '';
        if (!items || items.length === 0) {
            hideSuggestions();
            return;
        }

        items.slice(0, 6).forEach(item => {
            const a = document.createElement('a');
            a.href = `movie.html?slug=${item.slug}`;
            a.className = 'suggestion-item';
            a.innerHTML = `
                <img class="suggestion-thumb" src="${getSafeThumb(item.thumb_url || item.poster_url)}" alt="${item.name}" loading="lazy">
                <div class="suggestion-info">
                    <div class="suggestion-name">${item.name}</div>
                    <div class="suggestion-meta">
                        <span>${item.year || ''}</span>
                        <span class="suggestion-badge">${item.episode_current || 'HD'}</span>
                    </div>
                </div>
            `;
            suggestionsBox.appendChild(a);
        });

        const seeAll = document.createElement('a');
        seeAll.href = `index.html?search=${encodeURIComponent(query)}`;
        seeAll.className = 'suggestion-see-all';
        seeAll.textContent = `Xem tất cả kết quả cho "${query}" →`;
        suggestionsBox.appendChild(seeAll);
        suggestionsBox.classList.add('visible');
    };

    searchInput.addEventListener('input', () => {
        clearTimeout(suggestTimeout);
        const query = searchInput.value.trim();
        if (query.length < 2) {
            hideSuggestions();
            return;
        }

        suggestTimeout = setTimeout(async () => {
            try {
                const data = await VSAPI.searchMovies(query, 1);
                if (searchInput.value.trim() === query) {
                    showSuggestions(data?.items, query);
                }
            } catch {
                hideSuggestions();
            }
        }, 350);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `index.html?search=${encodeURIComponent(query)}`;
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            hideSuggestions();
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
            <span class="tag-quality"><i class="fas fa-star" style="font-size:0.7rem"></i> ${movie.quality || 'HD'} ${movie.lang || 'Vietsub'}</span>
            <span class="tag-year"><i class="fas fa-calendar-alt" style="font-size:0.7rem"></i> ${movie.year || '2024'}</span>
        `;
        if (movie.category && movie.category.length > 0) {
            movie.category.forEach(c => {
                tagsContainer.innerHTML += `<span class="tag-genre">${c.name}</span>`;
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

// Initialize Plyr player globally
let plyrPlayer = null;

function initPlayer() {
    if (!plyrPlayer) {
        const video = document.getElementById('videoPlayer');
        plyrPlayer = new Plyr(video, {
            controls: [
                'play-large', 'rewind', 'play', 'fast-forward', 'progress', 'current-time', 'duration', 
                'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
            ],
            settings: ['quality', 'speed'],
            autoplay: true,
            seekTime: 10,
            hideControls: true,       // Tự ẩn controls khi không có tương tác
            hideControlsTimeout: 2000 // Ẩn sau 2 giây không di chuột (ms)
        });
    }
}

function playEpisode(m3u8, embed) {
    const video = document.getElementById('videoPlayer');
    initPlayer();

    // Dùng HLS.js để phát luồng m3u8
    if (m3u8 && Hls.isSupported()) {
        if (window.hlsInstance) {
            window.hlsInstance.destroy();
        }
        const hls = new Hls({
            maxMaxBufferLength: 100,
        });
        hls.loadSource(m3u8);
        hls.attachMedia(video);
        window.hlsInstance = hls;
        
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(e => console.log("Autoplay prevented"));
        });
    } 
    // Fallback cho Safari (Hỗ trợ m3u8 native)
    else if (video.canPlayType('application/vnd.apple.mpegurl') && m3u8) {
        video.src = m3u8;
        video.addEventListener('loadedmetadata', function() {
            video.play().catch(e => console.log("Autoplay prevented"));
        });
    } 
    // Nếu cả 2 cách m3u8 đều lỗi, buộc phải fallback lại iframe (hiếm gặp vì ta đã đổi HTML thành video tag)
    // Tạm thời nếu m3u8 hỏng, Plyr sẽ báo lỗi.
    
    // Cuộn lên mượt mà
    document.querySelector('.player-container').scrollIntoView({behavior: 'smooth', block: 'center'});
}
