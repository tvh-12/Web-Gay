const API_BASE_URL = 'https://vsmov.com/api';

const VSAPI = {
    // Lấy danh sách phim mới cập nhật
    getLatestMovies: async (page = 1) => {
        try {
            const url = `https://vsmov.com/api/danh-sach/phim-moi-cap-nhat?page=${page}`;
            console.log('Fetching URL:', url); // Debug
            
            const response = await fetch(url);
            if (!response.ok) {
                // If the direct fetch fails due to CORS, we can try using a cors proxy if necessary.
                // Assuming it works based on 'Nguồn API Phim Miễn Phí'
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching latest movies:", error);
            // Fallback or let UI handle it
            return null;
        }
    },

    // Tìm kiếm phim
    searchMovies: async (keyword, page = 1) => {
        try {
            // Đúng chuẩn API tìm kiếm của VSMOV
            const url = `https://vsmov.com/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&limit=10&page=${page}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Error searching movies:", error);
            return null;
        }
    },

    // Lọc theo thể loại
    getMoviesByCategory: async (categorySlug, page = 1) => {
        try {
            // Máy chủ VSMOV lọc thể loại bị chập chờn, tự động mượn kết quả phân loại chuẩn từ PhimAPI
            const url = `https://phimapi.com/v1/api/the-loai/${categorySlug}?page=${page}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            
            if (data.status === true && data.data && data.data.items) {
                return {
                    status: true,
                    items: data.data.items,
                    pagination: data.data.params?.pagination || {}
                };
            }
            return { status: false, items: [] };
        } catch (error) {
            console.error("Error fetching category movies:", error);
            return null;
        }
    },

    // Lấy chi tiết phim
    getMovieDetail: async (slug) => {
        try {
            let vsData = null;

            // 1. Phải lấy dữ liệu gốc từ VSMOV
            try {
                const vsUrl = `https://vsmov.com/api/phim/${slug}`;
                const vsResponse = await fetch(vsUrl);
                vsData = await vsResponse.json();
            } catch (e) {
                console.warn("Lỗi lấy phim từ VSMOV:", e);
            }

            // 1.1 Nếu VSMOV không có phim này (Thường do slug lấy từ PhimAPI), ta phải fetch chi tiết từ PhimAPI
            if (!vsData || !vsData.status) {
                try {
                    const failoverUrl = `https://phimapi.com/phim/${slug}`;
                    const failoverRes = await fetch(failoverUrl);
                    vsData = await failoverRes.json();
                } catch (e) {}
            }

            if (!vsData || !vsData.status) {
                return null; // Không trang nào có
            }

            let episodes = vsData.episodes || [];

            // 2. Tự động mượn link xem phim bổ sung từ các cụm server mở khác (Ophim & KKPhim)
            if (episodes.length === 0 && vsData.movie && vsData.movie.name) {
                const searchKeyword = encodeURIComponent(vsData.movie.name);
                
                // Fallback 1: Thử tìm ở hệ thống Ophim1
                try {
                    const ophimRes = await fetch(`https://ophim1.com/v1/api/tim-kiem?keyword=${searchKeyword}`);
                    const ophimData = await ophimRes.json();
                    
                    if (ophimData?.data?.items?.length > 0) {
                        const ophimDetail = await fetch(`https://ophim1.com/phim/${ophimData.data.items[0].slug}`).then(r=>r.json());
                        if (ophimDetail?.status && ophimDetail.episodes) {
                            episodes = ophimDetail.episodes;
                        }
                    }
                } catch (e) { console.warn("Lỗi server 1:", e); }

                // Fallback 2: Nếu hệ thống 1 không có, thử tìm tiếp ở hệ thống KKPhim (PhimAPI)
                if (episodes.length === 0) {
                    try {
                        const kkRes = await fetch(`https://phimapi.com/v1/api/tim-kiem?keyword=${searchKeyword}`);
                        const kkData = await kkRes.json();
                        
                        if (kkData?.data?.items?.length > 0) {
                            const kkDetail = await fetch(`https://phimapi.com/phim/${kkData.data.items[0].slug}`).then(r=>r.json());
                            if (kkDetail?.status && kkDetail.episodes) {
                                episodes = kkDetail.episodes;
                            }
                        }
                    } catch (e) { console.warn("Lỗi server 2:", e); }
                }
            }

            vsData.episodes = episodes;
            return vsData;

        } catch (error) {
            console.error("Error fetching movie detail:", error);
            return null;
        }
    }
};
