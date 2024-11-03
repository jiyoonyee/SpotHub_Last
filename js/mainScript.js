let latitude = null;
let longitude = null;
let freindsLa = null;
let freindsLO = null;
let nowSi = null;
let nowGu = null;
let searchFlag = false;

let map; // 전역에서 선언하여 모든 함수에서 접근 가능하도록 설정
var geocoder = new kakao.maps.services.Geocoder();
infowindow = new kakao.maps.InfoWindow({ zindex: 1 });

const geoOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

const calculateMiddleLocation = () => {
  if (
    latitude !== null &&
    longitude !== null &&
    freindsLa !== null &&
    freindsLO !== null
  ) {
    console.log(latitude, longitude, " / ", freindsLa, freindsLO);
    const middleLatitude = (latitude + freindsLO) / 2;
    const middleLongitude = (longitude + freindsLa) / 2;

    console.log("중간 위치 위도:", middleLatitude, "경도:", middleLongitude);

    const middlePosition = new kakao.maps.LatLng(
      middleLatitude,
      middleLongitude
    );
    const middleMarker = new kakao.maps.Marker({
      position: middlePosition,
      map: map,
    });

    const middleInfoWindow = new kakao.maps.InfoWindow({
      content:
        '<div style="width:150px;text-align:center;padding:6px 0;">중간 위치</div>',
    });
    middleInfoWindow.open(map, middleMarker);

    map.setCenter(middlePosition);
    searchAddrFromCoords(map.getCenter(), displayCenterInfo);
  } else {
    console.warn("위치 정보가 부족하여 중간 위치를 계산할 수 없습니다.");
  }
};

const loadLocaion = (si, gu) => {
  const getSi = document.querySelector("#si");
  const getGu = document.querySelector("#gu");
  if (searchFlag) {
    if (nowSi != si && nowSi != null) {
      getSi.style.transition = "none";
      getSi.style.opacity = 0;
    }
    if (nowGu != gu && nowGu != null) {
      getGu.style.transition = "none";
      getGu.style.opacity = 0;
    }
  }

  setTimeout(() => {
    getSi.style.transition = "all 1s ease-in-out";
    document.querySelector("#si").style.opacity = 1;
  }, 500);
  setTimeout(() => {
    getGu.style.transition = "all 1s ease-in-out";
    document.querySelector("#gu").style.opacity = 1;
  }, 700);
};

const success = (position) => {
  latitude = position.coords.latitude;
  longitude = position.coords.longitude;

  const container = document.querySelector("#map");
  const options = {
    center: new kakao.maps.LatLng(latitude, longitude),
    level: 3, // 지도 확대 수준
  };

  map = new kakao.maps.Map(container, options); // 전역 map 변수에 할당

  const markerPosition = new kakao.maps.LatLng(latitude, longitude);
  const marker = new kakao.maps.Marker({ position: markerPosition });
  marker.setMap(map);

  const infowindow = new kakao.maps.InfoWindow({
    content:
      '<div style="width:150px;text-align:center;padding:6px 0;">내 위치</div>',
  });
  infowindow.open(map, marker);

  kakao.maps.event.addListener(map, "idle", function () {
    searchAddrFromCoords(map.getCenter(), displayCenterInfo);
  });

  searchAddrFromCoords(map.getCenter(), displayCenterInfo);

  document.querySelector("#searchLink").addEventListener("click", () => {
    searchFlag = !searchFlag;
    // geocoder.addressSearch(
    //   "제주특별자치도 제주시 첨단로 242",
    //   function (result, status) {
    //     if (status === kakao.maps.services.Status.OK) {
    //       const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
    //       freindsLO = coords.Ma;
    //       freindsLa = coords.La;

    //       const friendMarker = new kakao.maps.Marker({
    //         map: map,
    //         position: coords,
    //       });

    //       const friendInfoWindow = new kakao.maps.InfoWindow({
    //         content:
    //           '<div style="width:150px;text-align:center;padding:6px 0;">내 친구의 위치</div>',
    //       });
    //       friendInfoWindow.open(map, friendMarker);

    //       map.setCenter(coords);
    //       searchAddrFromCoords(map.getCenter(), displayCenterInfo);
    //     }
    //   }
    // );
    setTimeout(() => {
      searchFlag = !searchFlag;
    }, 1000);
    setTimeout(() => {
      calculateMiddleLocation();
    }, 2000);
  });
};

const error = (err) => {
  console.warn("ERROR(" + err.code + "): " + err.message);
};

const searchAddrFromCoords = (coords, callback) => {
  geocoder.coord2RegionCode(coords.getLng(), coords.getLat(), callback);
};

const displayCenterInfo = (result, status) => {
  if (status === kakao.maps.services.Status.OK) {
    for (let i = 0; i < result.length; i++) {
      if (result[i].region_type === "H") {
        loadLocaion(
          result[i].address_name.split(" ")[0],
          result[i].address_name.split(" ")[1]
        );

        nowSi = result[i].address_name.split(" ")[0];
        nowGu = result[i].address_name.split(" ")[1];

        document.querySelector("#si").textContent = nowSi;
        document.querySelector("#gu").textContent = nowGu;
        break;
      }
    }
  }
};

navigator.geolocation.getCurrentPosition(success, error, geoOptions);

loadLocaion();

document.querySelector(".inputSearchButton").addEventListener("click", () => {
  const inputWrap = document.querySelector(".locationInput");
  if (inputWrap)
    inputWrap.setAttribute(
      "style",
      "width:100%; background: rgba(255, 255, 255, 0.59);"
    );
});
