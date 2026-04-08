import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../api';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Header from '../components/Header';

function MapPage() {
  const [currentPos, setCurrentPos] = useState({ lat: 36.9103, lon: 127.1332 });
  const [mapObj, setMapObj] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [savedLandmarks, setSavedLandmarks] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) return;

    const container = document.getElementById('map');
    const options = {
      center: new window.kakao.maps.LatLng(currentPos.lat, currentPos.lon),
      level: 3
    };
    const kakaoMap = new window.kakao.maps.Map(container, options);
    setMapObj(kakaoMap);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        setCurrentPos({ lat, lon });
        const myLoc = new window.kakao.maps.LatLng(lat, lon);
        kakaoMap.setCenter(myLoc);
        new window.kakao.maps.Marker({
          map: kakaoMap,
          position: myLoc,
          title: "내 위치"
        });
        kakaoMap.relayout();
      });
    }
  }, []);

  const clearMarkers = () => {
    markers.forEach(m => m.setMap(null));
    setMarkers([]);
  };

  const handleSearchAndRecommend = useCallback((keyword) => {
    if (isLoading || !mapObj) return;
    setIsLoading(true);
    setAiResult(null);
    clearMarkers();

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(keyword, async (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const newMarkers = [];
        const placeDetails = data.slice(0, 8).map(p => {
          const pos = new window.kakao.maps.LatLng(p.y, p.x);
          const marker = new window.kakao.maps.Marker({
            map: mapObj,
            position: pos,
            title: p.place_name
          });

          window.kakao.maps.event.addListener(marker, 'click', () => {
            setSelectedPlace({
              name: p.place_name,
              address: p.address_name,
              category: p.category_name,
              lat: p.y,
              lng: p.x,
              type: 'new'
            });
          });

          newMarkers.push(marker);
          return `- ${p.place_name} (주소: ${p.address_name}, 카테고리: ${p.category_name})`;
        }).join("\n");

        setMarkers(newMarkers);

        try {
          const response = await apiClient.post(`/api/v1/ai/recommend`, {
            places: placeDetails,
            userQuery: (customPrompt || keyword) + " 주변의 공부하기 좋은 장소나 쉼터를 추천해줘."
          });
          setAiResult(response.data.data.answer || response.data.answer);
          setShowAiModal(true);
        } catch (err) {
          alert("AI 추천 실패");
        } finally {
          setIsLoading(false);
        }
      }
      setIsLoading(false);
    }, { location: new window.kakao.maps.LatLng(currentPos.lat, currentPos.lon), radius: 2000 });
  }, [customPrompt, currentPos, isLoading, mapObj, clearMarkers]);

  const fetchAndShowSavedLandmarks = async () => {
    try {
      const response = await apiClient.get('/api/v1/landmarks');
      setSavedLandmarks(response.data.data);
      setShowSaved(true);
    } catch (error) {
      alert("목록 호출 실패");
    }
  };

  const handleSaveLocation = async (place) => {
    const description = prompt(`${place.name}에 대한 메모:`, place.category || "");
    if (description === null) return;
    try {
      await apiClient.post('/api/v1/landmarks/register', {
        name: place.name,
        description: description,
        latitude: place.lat,
        longitude: place.lng,
        distance: 0.0
      });
      alert("✅ 저장 완료!");
      fetchAndShowSavedLandmarks();
    } catch (error) { alert("❌ 저장 실패"); }
  };

  const openKakaoRoute = (place) => {
    const url = `https://map.kakao.com/link/to/${place.name},${place.lat || place.latitude},${place.lng || place.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div style={styles.layout}>
      <Header />
      <div style={styles.mapContainer}>
        <div style={styles.floatingSearch} className="map-floating-search">
          <input
            type="text"
            placeholder="장소나 키워드를 입력하세요"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            style={styles.searchInput}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchAndRecommend(customPrompt)}
          />
          <div style={styles.btnRow} className="map-btn-row">
            <button onClick={() => handleSearchAndRecommend("학원")} style={styles.aiBtn}>🎓 학원</button>
            <button onClick={() => handleSearchAndRecommend("스터디카페")} style={styles.aiBtn}>✍️ 스터디카페</button>
            <button onClick={() => handleSearchAndRecommend("공원")} style={{ ...styles.aiBtn, backgroundColor: '#34a853' }}>🌳 쉼터</button>
            <button onClick={fetchAndShowSavedLandmarks} style={styles.listBtn}>📚 목록</button>
          </div>
        </div>

        {showSaved && (
          <div style={styles.sidebar} className="map-sidebar">
            <div style={styles.sidebarHeader}>
              <strong>내 스터디 맵</strong>
              <button onClick={() => setShowSaved(false)} style={styles.closeX}>✕</button>
            </div>
            <div style={styles.sidebarBody}>
              {savedLandmarks.length === 0 ? <p style={{ fontSize: '12px', textAlign: 'center', color: '#999' }}>저장된 장소가 없습니다.</p> :
                savedLandmarks.map(place => (
                  <div key={place.id} style={styles.listItem} onClick={() => {
                    const moveLatLng = new window.kakao.maps.LatLng(place.latitude, place.longitude);
                    mapObj.panTo(moveLatLng);
                    setSelectedPlace({ ...place, type: 'saved' });
                    if (window.innerWidth <= 768) setShowSaved(false);
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{place.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{place.description}</div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {selectedPlace && (
          <div style={styles.resultCard} className="map-result-card">
            <div style={styles.cardHeader}>{selectedPlace.type === 'saved' ? '📌 저장된 장소' : '📍 검색 결과'}</div>
            <div style={{ margin: '12px 0' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>{selectedPlace.name}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{selectedPlace.address || selectedPlace.description}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }} className="map-card-btns">
              <button onClick={() => openKakaoRoute(selectedPlace)} style={styles.routeBtn}>🚗 길안내</button>
              {selectedPlace.type !== 'saved' && (
                <button onClick={() => handleSaveLocation(selectedPlace)} style={styles.saveBtn}>⭐ 저장</button>
              )}
              <button onClick={() => setSelectedPlace(null)} style={styles.cardCloseBtn}>닫기</button>
            </div>
          </div>
        )}

        {showAiModal && aiResult && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h3 style={{ margin: 0 }}>🤖 AI 추천 가이드</h3>
                <button onClick={() => setShowAiModal(false)} style={styles.closeX}>✕</button>
              </div>
              <div style={styles.modalBody}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResult}</ReactMarkdown>
              </div>
              <div style={styles.modalFooter}>
                <button onClick={() => setShowAiModal(false)} style={styles.confirmBtn}>확인</button>
              </div>
            </div>
          </div>
        )}

        <div id="map" style={{ width: '100%', height: '100%', touchAction: 'none' }}></div>
      </div>
      <style>{`
        @media screen and (max-width: 768px) {
          .map-floating-search { top: 10px !important; width: 95% !important; }
          .map-btn-row { flex-wrap: wrap !important; gap: 5px !important; }
          .map-btn-row button { padding: 8px 12px !important; font-size: 12px !important; flex: 1; min-width: 80px; }
          
          .map-sidebar { 
            top: auto !important; 
            bottom: 0 !important; 
            left: 0 !important; 
            right: 0 !important; 
            width: 100% !important; 
            border-radius: 24px 24px 0 0 !important; 
            max-height: 50vh !important;
            padding: 24px 20px !important;
          }
          
          .map-result-card {
            bottom: 10px !important;
            width: 95% !important;
            padding: 20px !important;
          }
          .map-card-btns button { padding: 10px 5px !important; font-size: 13px !important; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  layout: { width: '100vw', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  mapContainer: { flex: 1, position: 'relative' },
  floatingSearch: { position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, width: '90%', maxWidth: '650px', display: 'flex', flexDirection: 'column', gap: '10px' },
  searchInput: { padding: '15px 25px', borderRadius: '30px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', outline: 'none', fontSize: '15px' },
  btnRow: { display: 'flex', gap: '8px', justifyContent: 'center' },
  aiBtn: { padding: '10px 20px', backgroundColor: '#4285F4', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  listBtn: { padding: '10px 20px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  sidebar: { position: 'absolute', top: '150px', right: '20px', zIndex: 1001, width: '280px', backgroundColor: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', maxHeight: '60vh', display: 'flex', flexDirection: 'column' },
  sidebarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  sidebarBody: { overflowY: 'auto', flex: 1 },
  listItem: { padding: '14px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s' },
  closeX: { border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' },
  resultCard: { position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 102, width: '90%', maxWidth: '420px', padding: '25px', backgroundColor: '#fff', borderRadius: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
  cardHeader: { fontSize: '12px', fontWeight: 'bold', color: '#4285F4', letterSpacing: '1px' },
  routeBtn: { flex: 1.5, padding: '12px', backgroundColor: '#fee500', color: '#333', border: 'none', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' },
  saveBtn: { flex: 1, padding: '12px', backgroundColor: '#4285F4', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' },
  cardCloseBtn: { padding: '12px 18px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '14px', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  modalContent: { backgroundColor: '#fff', width: '90%', maxWidth: '500px', borderRadius: '28px', overflow: 'hidden' },
  modalHeader: { padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalBody: { padding: '24px', maxHeight: '50vh', overflowY: 'auto', fontSize: '15px' },
  modalFooter: { padding: '15px 24px', borderTop: '1px solid #f1f5f9', textAlign: 'right' },
  confirmBtn: { padding: '12px 25px', backgroundColor: '#4285F4', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }
};

export default MapPage;