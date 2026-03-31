import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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

  const navigate = useNavigate();

  useEffect(() => {
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
        new window.kakao.maps.Marker({ map: kakaoMap, position: myLoc });
      });
    }
  }, [currentPos.lat, currentPos.lon]);

  const fetchAndShowSavedLandmarks = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8090/api/v1/landmarks');
      const data = response.data.data;
      setSavedLandmarks(data);
      setShowSaved(true);

      markers.forEach(m => m.setMap(null));

      const newMarkers = data.map(place => {
        const pos = new window.kakao.maps.LatLng(place.latitude, place.longitude);
        const marker = new window.kakao.maps.Marker({
          map: mapObj,
          position: pos,
          title: place.name
        });

        window.kakao.maps.event.addListener(marker, 'click', () => {
          setSelectedPlace(place);
          setAiResult(null);
        });

        return marker;
      });

      setMarkers(newMarkers);
    } catch (error) {
      alert("저장된 장소를 가져오지 못했습니다.");
    }
  }, [mapObj, markers]);

  const handleAIRecommendation = useCallback(() => {
    if (isLoading) return;
    const finalQuery = customPrompt.trim() || "주변 가볼만한 곳을 추천하고 각 장소의 특징을 설명해줘";
    setAiResult(null);
    setSelectedPlace(null);
    setIsLoading(true);
    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch('관광명소', async (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const placeDetails = data.slice(0, 6).map(p =>
          `- ${p.place_name} (주소: ${p.address_name}, 카테고리: ${p.category_name})`
        ).join("\n");
        try {
          const response = await axios.post(`http://localhost:8090/api/v1/ai/recommend`, {
            places: placeDetails,
            userQuery: finalQuery + " (반드시 주소 정보를 포함해서 답변해줘)"
          });
          setAiResult(response.data.data.answer || response.data.answer);
        } catch (err) { alert("AI 서버 연결 실패!"); } finally { setIsLoading(false); }
      }
    }, { location: new window.kakao.maps.LatLng(currentPos.lat, currentPos.lon), radius: 2000 });
  }, [customPrompt, currentPos, isLoading]);

  const openRoute = (place) => {
    const url = `https://map.kakao.com/link/to/${place.name},${place.latitude},${place.longitude}`;
    window.open(url, '_blank');
  };

  const handleSaveLocation = async () => {
    const name = prompt("저장할 장소의 이름을 입력하세요:");
    if (!name) return;
    const description = prompt("장소에 대한 설명을 입력하세요:", "설명 없음");
    try {
      await axios.post('http://localhost:8090/api/v1/landmarks/register', {
        name, description, latitude: currentPos.lat, longitude: currentPos.lon, distance: 0.0
      });
      alert("✅ 위치 저장 완료!");
      fetchAndShowSavedLandmarks();
    } catch (error) { alert("❌ 저장 실패"); }
  };

  // 로그인 상태 체크 임시 추가 (사용하지 않던 navigate 활용)
  useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token || token === "undefined") {
        navigate('/login');
      }
  }, [navigate]);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* AI 입력창 */}
        <div style={aiInputAreaStyle}>
          <input
            type="text"
            placeholder="어떤 장소를 찾으시나요?"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            style={inputStyle}
            onKeyDown={(e) => e.key === 'Enter' && handleAIRecommendation()}
          />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={handleAIRecommendation} style={buttonStyle("#4285F4", "white")}>
              {isLoading ? "🤖 분석 중..." : "✨ AI 추천받기"}
            </button>
            <button onClick={handleSaveLocation} style={buttonStyle("#fee500", "black")}>📍 학원 추천하기</button>
            <button onClick={fetchAndShowSavedLandmarks} style={buttonStyle("#34a853", "white")}>📚 학원 추천 목록</button>
          </div>
        </div>

        {showSaved && (
          <div style={sidebarStyle}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
              <strong style={{fontSize:'16px'}}>추천 목록</strong>
              <button onClick={()=>setShowSaved(false)} style={{border:'none', background:'none', cursor:'pointer'}}>X</button>
            </div>
            <div style={{overflowY:'auto', maxHeight:'80vh'}}>
              {savedLandmarks.length === 0 ? <p style={{fontSize:'12px'}}>저장된 장소가 없습니다.</p> :
                savedLandmarks.map(place => (
                  <div key={place.id} style={listItemStyle} onClick={() => {
                    mapObj.panTo(new window.kakao.maps.LatLng(place.latitude, place.longitude));
                    setSelectedPlace(place);
                    setAiResult(null);
                  }}>
                    <div style={{fontWeight:'bold', fontSize:'14px'}}>{place.name}</div>
                    <div style={{fontSize:'12px', color:'#666'}}>{place.description}</div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {selectedPlace && (
          <div style={resultCardStyle}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#34a853' }}>📍 저장된 장소 정보</div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{selectedPlace.name}</div>
              <div style={{ fontSize: '13px', color: '#666' }}>{selectedPlace.description}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => openRoute(selectedPlace)} style={actionButtonStyle("#fee500", "#333")}>🚗 길찾기 시작</button>
              <button onClick={() => window.open(`https://map.kakao.com/link/search/${encodeURIComponent(selectedPlace.name)}`, '_blank')} style={actionButtonStyle("#eee", "#333")}>🔍 상세검색</button>
            </div>
            <button onClick={() => setSelectedPlace(null)} style={closeButtonStyle}>닫기</button>
          </div>
        )}

        {aiResult && (
          <div style={resultCardStyle}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#4285F4' }}>🤖 AI 가이드 추천</div>
            <div style={{ fontSize: '14px', lineHeight: '1.6', maxHeight: '200px', overflowY: 'auto', marginBottom: '15px', color: '#333' }}>
              {aiResult}
            </div>
            <button onClick={() => setAiResult(null)} style={closeButtonStyle}>닫기</button>
          </div>
        )}

        <div id="map" style={{ width: '100%', height: '100%' }}></div>
      </div>
    </div>
  );
}

const actionButtonStyle = (bg, color) => ({ flex: 1, padding: '10px', backgroundColor: bg, color: color, border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' });
const aiInputAreaStyle = { position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '10px', width: '90%', maxWidth: '600px' };
const inputStyle = { padding: '15px 20px', borderRadius: '30px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', outline: 'none' };
const buttonStyle = (bg, color) => ({ padding: '10px 15px', backgroundColor: bg, color: color, border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize:'13px' });
const resultCardStyle = { position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 101, width: '90%', maxWidth: '450px', padding: '20px', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };
const sidebarStyle = { position: 'absolute', top: '150px', right: '20px', zIndex: 1001, width: '250px', backgroundColor: 'white', borderRadius: '15px', padding: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', maxHeight: '70vh' };
const listItemStyle = { padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', transition: 'background 0.2s', borderRadius: '8px' };
const closeButtonStyle = { marginTop: '10px', width: '100%', padding: '8px', border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#999', fontSize: '12px' };

export default MapPage;
