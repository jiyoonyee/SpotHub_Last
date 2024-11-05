let latitude = null;
let longitude = null;
let freindsLa = null;
let freindsLO = null;
let nowSi = null;
let nowGu = null;
let searchFlag = false;
let openInput = false;
let savePageOpen = false;

let map;
let marker = null; // 사용자 위치 마커
let friendMarker = null; // 친구 위치 마커
let middleMarker = null; // 중간 위치 마커

let friendInfoWindow = null; // 친구 위치 말풍선
let middleInfoWindow = null; // 중간 위치 말풍선

var geocoder = new kakao.maps.services.Geocoder();
infowindow = new kakao.maps.InfoWindow({ zindex: 1 });

// 커스텀 오버레이와 마커 배열 선언
var placeOverlay = new kakao.maps.CustomOverlay({ zIndex: 1 }),
  contentNode = document.createElement("div"),
  markers = [],
  currCategory = "";

// 초기 설정
contentNode.className = "placeinfo_wrap";
placeOverlay.setContent(contentNode);

// 지도 설정
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
    const middleLatitude = (latitude + freindsLO) / 2;
    const middleLongitude = (longitude + freindsLa) / 2;
    const middlePosition = new kakao.maps.LatLng(
      middleLatitude,
      middleLongitude
    );

    if (middleMarker) {
      middleMarker.setMap(null);
      if (middleInfoWindow) middleInfoWindow.close();
    }

    middleMarker = new kakao.maps.Marker({
      position: middlePosition,
      map: map,
    });

    middleInfoWindow = new kakao.maps.InfoWindow({
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
    level: 3,
  };

  map = new kakao.maps.Map(container, options);

  const markerPosition = new kakao.maps.LatLng(latitude, longitude);

  if (!marker) {
    marker = new kakao.maps.Marker({ position: markerPosition });
    marker.setMap(map);

    const infowindow = new kakao.maps.InfoWindow({
      content:
        '<div style="width:150px;text-align:center;padding:6px 0;">내 위치</div>',
    });
    infowindow.open(map, marker);
  }

  kakao.maps.event.addListener(map, "idle", function () {
    searchAddrFromCoords(map.getCenter(), displayCenterInfo);
    searchPlaces();
  });

  searchAddrFromCoords(map.getCenter(), displayCenterInfo);

  document.querySelector(".inputSearchButton").addEventListener("click", () => {
    const inputWrap = document.querySelector(".locationInput");
    inputWrap.focus();

    if (!openInput) {
      inputWrap.setAttribute(
        "style",
        "width:100%; background: rgba(255, 255, 255, 0.59);"
      );
      inputWrap.classList.add("open");
      openInput = !openInput;
    }

    if (inputWrap.classList.contains("open")) {
      searchFlag = !searchFlag;
      geocoder.addressSearch(
        document.querySelector(".locationInput").value,
        function (result, status) {
          if (status === kakao.maps.services.Status.OK) {
            const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
            freindsLO = coords.Ma;
            freindsLa = coords.La;

            if (friendMarker) {
              friendMarker.setMap(null);
              if (friendInfoWindow) friendInfoWindow.close();
            }

            friendMarker = new kakao.maps.Marker({
              map: map,
              position: coords,
            });

            friendInfoWindow = new kakao.maps.InfoWindow({
              content:
                '<div style="width:150px;text-align:center;padding:6px 0;">내 친구의 위치</div>',
            });
            friendInfoWindow.open(map, friendMarker);

            map.setCenter(coords);
            searchAddrFromCoords(map.getCenter(), displayCenterInfo);
          }
        }
      );
      setTimeout(() => {
        searchFlag = !searchFlag;
      }, 1000);
    }
  });

  document.querySelector("#searchLink").addEventListener("click", () => {
    setTimeout(() => {
      calculateMiddleLocation();
    }, 1000);
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

// 카테고리별 검색
function searchPlaces() {
  if (!currCategory) {
    return;
  }
  placeOverlay.setMap(null);
  removeMarker();
  const ps = new kakao.maps.services.Places(map);
  ps.categorySearch(currCategory, placesSearchCB, { useMapBounds: true });
}

function placesSearchCB(data, status, pagination) {
  if (status === kakao.maps.services.Status.OK) {
    displayPlaces(data);
  }
}

function displayPlaces(places) {
  const order = document
    .getElementById(currCategory)
    .getAttribute("data-order");
  const placeinfoWrap = document.querySelector(".placeinfoWrap"); // placeinfoWrap 요소 가져오기

  placeinfoWrap.innerHTML = ""; // 이전 결과 초기화

  for (let i = 0; i < places.length; i++) {
    // 마커 추가
    const marker = addMarker(
      new kakao.maps.LatLng(places[i].y, places[i].x),
      order
    );
    (function (marker, place) {
      kakao.maps.event.addListener(marker, "click", function () {
        displayPlaceInfo(place);
      });
    })(marker, places[i]);

    // 장소 정보 생성 및 추가
    const placeInfoDiv = document.createElement("div");
    placeInfoDiv.className = "placeinfo";

    const titleLink = document.createElement("a");
    titleLink.className = "title";
    titleLink.href = places[i].place_url;
    titleLink.target = "_blank";
    titleLink.textContent = places[i].place_name;
    placeInfoDiv.appendChild(titleLink);

    const addressSpan = document.createElement("i");
    addressSpan.className = "fa-solid fa-chevron-right";

    placeInfoDiv.appendChild(addressSpan);

    placeinfoWrap.appendChild(placeInfoDiv); // placeinfoWrap에 추가
  }
}

function addMarker(position, order) {
  // const imageSrc =
  //     "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/places_category.png",
  const imageSrc = "../img/heart.png",
    imageSize = new kakao.maps.Size(27, 28),
    imgOptions = {
      spriteSize: new kakao.maps.Size(50, 50),
      spriteOrigin: new kakao.maps.Point(45),
      offset: new kakao.maps.Point(-11, 28),
    },
    markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imgOptions),
    marker = new kakao.maps.Marker({
      position: position,
      image: markerImage,
    });
  marker.setMap(map);
  markers.push(marker);

  return marker;
}

function removeMarker() {
  for (let i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  markers = [];
}
let placeInfoClone = document.querySelector(".placeinfo").cloneNode(true);
console.log(placeInfoClone);
function displayPlaceInfo(place) {
  const content = `
  <a class="placeinfoOnMap" href="${place.place_url}">
    <p class="title"  target="_blank">${place.place_name}</p>
    <i class="fa-solid fa-chevron-right"></i>
  </a>`;
  contentNode.innerHTML = content;
  placeOverlay.setPosition(new kakao.maps.LatLng(place.y, place.x));
  placeOverlay.setMap(map);
}

function addCategoryClickEvent() {
  const category = document.getElementById("category").children;
  for (let i = 0; i < category.length; i++) {
    category[i].onclick = onClickCategory;
  }
}

function onClickCategory() {
  placeOverlay.setMap(null);
  if (this.className === "on") {
    currCategory = "";
    changeCategoryClass();
    removeMarker();
  } else {
    currCategory = this.id;
    changeCategoryClass(this);
    searchPlaces();
  }
}

function changeCategoryClass(el) {
  const category = document.getElementById("category").children;
  for (let i = 0; i < category.length; i++) {
    category[i].classList.remove("on");
  }
  if (el) {
    el.classList.add("on");
  }
}

function changeCategoryClassInfo(el) {
  const category = document.getElementById("category").children;
  for (let i = 0; i < category.length; i++) {
    category[i].classList.remove("on");
  }
  if (el) {
    el.classList.add("on");
  }
}

navigator.geolocation.getCurrentPosition(success, error, geoOptions);

loadLocaion();

document.querySelector("#map").addEventListener("click", () => {
  const inputWrap = document.querySelector(".locationInput");
  inputWrap.setAttribute(
    "style",
    "width:0%; background: rgba(255, 255, 255, 0.59);"
  );
  inputWrap.blur();
  openInput = !openInput;
});

document.querySelector("#saveLink").addEventListener("click", () => {
  const savePage = document.querySelector(".selectedSpot");

  if (!savePageOpen) {
    savePage.setAttribute("style", "transform: translateX(0%);");
    savePageOpen = !savePageOpen;
    console.log(markers);
  }
});

document.querySelector(".closeButton").addEventListener("click", (e) => {
  document
    .querySelector(".selectedSpot")
    .setAttribute("style", "transform: translateX(-100%);");
  savePageOpen = !savePageOpen;
});

addCategoryClickEvent(); // 카테고리 클릭 이벤트 초기화
