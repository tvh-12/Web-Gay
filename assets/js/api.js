// ============================================================
//  API Layer - GayPhim
//  Nguồn chính: phimapi.com (cùng nguồn với MotPhim, PhimMoiChill)
//  CDN ảnh   : phimimg.com
// ============================================================

const CDN_IMAGE = 'https://phimimg.com';

// Chuẩn hoá URL ảnh (một số item trả về path tương đối)
function normalizeImage(url) {
    if (!url || url.length < 5) {
        return `${CDN_IMAGE}/upload/vod/20230303-1/c2763dfef33b0036ee7bfeb6f2bdee5b.jpg`;
    }
    if (url.startsWith('http')) return url;
    return `${CDN_IMAGE}/${url}`;
}

const VSAPI = {

    // ── Danh sách phim mới cập nhật ─────────────────────────
    getLatestMovies: async (page = 1) => {
        try {
            const url = `https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=${page}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();

            if (!json.status || !json.items) return null;

            // Chuẩn hoá ảnh
            json.items = json.items.map(m => ({
                ...m,
                poster_url: normalizeImage(m.poster_url),
                thumb_url:  normalizeImage(m.thumb_url),
            }));

            return {
                status: true,
                items: json.items,
                pagination: json.pagination || {}
            };
        } catch (err) {
            console.error('[API] getLatestMovies:', err);
            return null;
        }
    },

    // ── Tìm kiếm phim ───────────────────────────────────────
    searchMovies: async (keyword, page = 1) => {
        try {
            const url = `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&limit=12&page=${page}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();

            const raw = json?.data?.items || [];
            const items = raw.map(m => ({
                ...m,
                poster_url: normalizeImage(m.poster_url),
                thumb_url:  normalizeImage(m.thumb_url),
            }));

            const params = json?.data?.params?.pagination || {};
            return {
                status: true,
                items,
                pagination: {
                    totalItems:        params.totalItems        || items.length,
                    totalItemsPerPage: params.totalItemsPerPage || 12,
                    currentPage:       params.currentPage       || page,
                    totalPages:        params.totalPages        || 1,
                }
            };
        } catch (err) {
            console.error('[API] searchMovies:', err);
            return null;
        }
    },

    // ── Lọc theo thể loại ───────────────────────────────────
    getMoviesByCategory: async (categorySlug, page = 1) => {
        try {
            const url = `https://phimapi.com/v1/api/the-loai/${categorySlug}?page=${page}&limit=24`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();

            const raw = json?.data?.items || [];
            const items = raw.map(m => ({
                ...m,
                poster_url: normalizeImage(m.poster_url),
                thumb_url:  normalizeImage(m.thumb_url),
            }));

            const pg = json?.data?.params?.pagination || {};
            return {
                status: true,
                items,
                pagination: {
                    totalItems:        pg.totalItems        || items.length,
                    totalItemsPerPage: pg.totalItemsPerPage || 24,
                    currentPage:       pg.currentPage       || page,
                    totalPages:        pg.totalPages        || 1,
                }
            };
        } catch (err) {
            console.error('[API] getMoviesByCategory:', err);
            return null;
        }
    },

    // ── Chi tiết phim + tập phim ────────────────────────────
    getMovieDetail: async (slug) => {
        try {
            const url = `https://phimapi.com/phim/${slug}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();

            if (!json.status || !json.movie) return null;

            // Chuẩn hoá ảnh phim
            json.movie.poster_url = normalizeImage(json.movie.poster_url);
            json.movie.thumb_url  = normalizeImage(json.movie.thumb_url);

            // Trả về định dạng tương thích với movie.js
            return {
                status:   true,
                movie:    json.movie,
                episodes: json.episodes || []
            };

        } catch (err) {
            console.error('[API] getMovieDetail:', err);
            return null;
        }
    }
};
