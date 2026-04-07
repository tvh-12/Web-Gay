document.addEventListener('DOMContentLoaded', () => {
    // Navigation transparent on scroll
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(2, 6, 23, 0.9)'; // Darker on scroll
        } else {
            header.style.background = 'var(--glass-bg)';
        }
    });

    // Elements
    const movieGrid = document.getElementById('movieGrid');
    const moviesLoader = document.getElementById('moviesLoader');
    const heroTitle = document.getElementById('heroTitle');
    const heroDesc = document.getElementById('heroDesc');
    const heroBackdrop = document.getElementById('heroBackdrop');
    const heroPlayBtn = document.getElementById('heroPlayBtn');
    const heroTags = document.getElementById('heroTags');
    
    // Pagination
    let currentPage = 1;
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const currentPageSpan = document.getElementById('currentPage');
    const jumpPageInput = document.getElementById('jumpPageInput');

    // Search
    const searchInput = document.getElementById('searchInput');

    // Global App domain for images (most Ophim sites return a path, we need the domain)
    // Wait, the API usually returns full path for thumb_url, but sometimes it returns relative.
    const APP_DOMAIN = 'https://vsmov.com';

    function getImageUrl(path) {
        if (!path) return 'https://via.placeholder.com/300x450';
        if (path.startsWith('http')) return path; // Already complete
        return APP_DOMAIN + '/uploads/movies/' + path; // Fallback, we'll refine if needed. Note: Many APIs provide path via APP_DOMAIN. Let's assume it provides full path.
    }

    async function loadMovies(page) {
        movieGrid.innerHTML = '';
        moviesLoader.classList.add('active');

        // Check if searching
        const query = searchInput.value.trim();
        const navUrlParams = new URLSearchParams(window.location.search);
        const navCategory = navUrlParams.get('category');
        let data;
        
        if (query) {
            data = await VSAPI.searchMovies(query, page);
            document.querySelector('.section-title').textContent = `Kết quả tìm kiếm cho: "${query}"`;
        } else if (navCategory) {
            // Mapping ten hien thi
            const catMap = {
                'hanh-dong': 'Hành động', 'tinh-cam': 'Tình cảm', 
                'kinh-di': 'Kinh dị', 'hai-huoc': 'Hài hước',
                'hoat-hinh': 'Hoạt hình', 'phieu-luu': 'Phiêu lưu'
            };
            const catDisplayName = catMap[navCategory] || navCategory;
            data = await VSAPI.getMoviesByCategory(navCategory, page);
            document.querySelector('.section-title').textContent = `Thể loại phim: ${catDisplayName}`;
        } else {
            data = await VSAPI.getLatestMovies(page);
            document.querySelector('.section-title').textContent = `Phim Mới Cập Nhật`;
        }
        
        moviesLoader.classList.remove('active');

        if (data && data.items && data.items.length > 0) {
            renderMovies(data.items);
            
            // Set first movie as hero if we are on first page and not searching 
            // (or if searching, can set hero to search result top)
            if (page === 1) {
                setHeroMovie(data.items[0]);
            }

            // Update pagination state
            currentPage = page;
            currentPageSpan.textContent = page;
            prevBtn.disabled = page === 1;
            
            // Typical totalPages in some APIs is in data.pagination.totalPages
            const totalPages = data.pagination?.totalPages || (page + 1); // fallback
            nextBtn.disabled = page >= totalPages;
        } else {
            movieGrid.innerHTML = '<p style="text-align:center; grid-column:1/-1;">Không tìm thấy phim nào.</p>';
        }
    }

    function renderMovies(items) {
        items.forEach((item, index) => {
            const card = document.createElement('a');
            card.href = `movie.html?slug=${item.slug}`;
            card.className = 'movie-card';
            card.style.animationDelay = `${index * 0.05}s`;
            
            // Determine image URL safely
            const safeImageUrl = (url) => {
                if (typeof url !== 'string' || url.length < 5) return 'https://phimimg.com/upload/vod/20230303-1/c2763dfef33b0036ee7bfeb6f2bdee5b.jpg';
                if (url.startsWith('http')) return url;
                return `https://phimimg.com/${url}`;
            };
            const imageUrl = safeImageUrl(item.thumb_url || item.poster_url);

            card.innerHTML = `
                <img src="${imageUrl}" alt="${item.name}" class="movie-poster" loading="lazy">
                <div class="play-overlay"><i class="fas fa-play"></i></div>
                <div class="movie-info">
                    <h3 class="movie-title">${item.name}</h3>
                    <div class="movie-meta">
                        <span>${item.year || '2024'}</span>
                        <span style="color: var(--accent-color); font-weight:600">${item.episode_current || 'Tập 1'}</span>
                    </div>
                </div>
            `;
            movieGrid.appendChild(card);
        });
    }

    function setHeroMovie(movie) {
        heroTitle.textContent = movie.name;
        // Strip html tags if description exists
        let desc = typeof movie.content === 'string' ? movie.content : (typeof movie.origin_name === 'string' ? movie.origin_name : 'Đang cập nhật nội dung...');
        desc = desc.replace(/<[^>]*>?/gm, '');
        heroDesc.textContent = desc;
        
        heroTags.innerHTML = `
            <span>${movie.quality || 'HD'} ${movie.lang || 'Vietsub'}</span>
            <span>${movie.year || '2024'}</span>
        `;
        
        const safeImageUrl = (url) => {
            if (typeof url !== 'string' || url.length < 5) return 'https://phimimg.com/upload/vod/20230303-1/c2763dfef33b0036ee7bfeb6f2bdee5b.jpg';
            if (url.startsWith('http')) return url;
            return `https://phimimg.com/${url}`;
        };
        const bannerUrl = safeImageUrl(movie.poster_url || movie.thumb_url);
        heroBackdrop.style.backgroundImage = `url('${bannerUrl}')`;
        heroPlayBtn.href = `movie.html?slug=${movie.slug}`;
    }

    // Event Listeners
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            loadMovies(currentPage - 1);
            document.getElementById('heroSection').scrollIntoView({behavior: 'smooth'});
        }
    });

    nextBtn.addEventListener('click', () => {
        loadMovies(currentPage + 1);
        document.getElementById('heroSection').scrollIntoView({behavior: 'smooth'});
    });

    if (jumpPageInput) {
        jumpPageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const page = parseInt(jumpPageInput.value);
                if (!isNaN(page) && page > 0) {
                    loadMovies(page);
                    document.getElementById('heroSection').scrollIntoView({behavior: 'smooth'});
                    jumpPageInput.value = '';
                }
            }
        });
    }

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentPage = 1;
            loadMovies(1);
        }, 800); // 800ms debounce
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(searchTimeout);
            currentPage = 1;
            loadMovies(1);
        }
    });

    // Init load
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
        searchInput.value = searchParam;
    }
    
    loadMovies(1);
});
