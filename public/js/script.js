var socket = io();

var videoChatForm = document.getElementById('video-chat-form');
var videoChatRooms = document.getElementById('video-chat-rooms');
var joinBtn = document.getElementById('join');
var roomInput = document.getElementById('roomName');
var userVideo = document.getElementById('user-video');
var peerVideo = document.getElementById('peer-video');


// upgrading part
var divBtnGroup = document.getElementById('btn-group');
var muteBtn = document.getElementById('muteBtn');
var hideBtn = document.getElementById('hideBtn');

var muteFlag = false;
var hideFlag = false;


var roomName = roomInput.value;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

var creator = false;

var rtcPeerConnection;

var userStream;

var iceServers = {
    iceServers: [
        { urls: "stun:stun.services.mozilla.com" },
        { urls: "stun:stun1.l.google.com:19302" }
    ]
}

joinBtn.addEventListener('click', () => {
    if (roomInput.value == "") {
        alert("Please enter a room name");
    } else {
        socket.emit('join', roomName);
    }
})


muteBtn.addEventListener('click', () => {
    muteFlag = !muteFlag;
    if (muteFlag) {
        userStream.getTracks()[0].enabled = false;
        muteBtn.innerText = "U";
        muteBtn.style = "background-color:red";
    } else {
        userStream.getTracks()[0].enabled = true;
        muteBtn.innerText = "M";
        muteBtn.style = "background-color:transparent";
    }
})

hideBtn.addEventListener('click', () => {
    hideFlag = !hideFlag;
    if (hideFlag) {
        userStream.getTracks()[1].enabled = false;
        peerVideo.style = "display:none";
        hideBtn.style = "background-color:red";
    } else {
        userStream.getTracks()[1].enabled = true;
        peerVideo.style = "display:block";
        hideBtn.style = "background-color:transparent";
    }
})


socket.on("created", () => {
    creator = true;
    navigator.getUserMedia(
        {
            audio: true,
            video: { width: 500, height: 500 }
        },
        function (stream) {
            userStream = stream;
            videoChatForm.style = 'display:none';
            divBtnGroup.style = 'display:flex';
            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = function (e) {
                userVideo.play();
            }
        },
        function (err) {
            console.log("You can't access the camera");
        }
    )
})


socket.on("joinedRoom", () => {
    creator = false;
    navigator.getUserMedia(
        {
            audio: true,
            video: { width: 500, height: 500 }
        },
        function (stream) {
            userStream = stream;
            videoChatForm.style = 'display:none';
            divBtnGroup.style = 'display:flex';
            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = function (e) {
                userVideo.play();
            }
            socket.emit('ready', roomName);
        },
        function (err) {
            console.log("You can't access the camera");
        }
    )
})


socket.on("fullRoom", () => {
    alert("Room is full");
})


socket.on("ready", () => {
    if (creator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidateFunc;
        rtcPeerConnection.ontrack = onTrackFunc;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream); // For audio track
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream); // For video track
        rtcPeerConnection.createOffer(
            function (offer) {
                rtcPeerConnection.setLocalDescription(offer)
                socket.emit('offer', offer, roomName);
            },
            function (err) {
                console.log("Error:", err);
            }
        )
    }
})


socket.on("candidate", (candidate) => {
    var iceCandidate = new RTCIceCandidate(candidate);
    rtcPeerConnection.addIceCandidate(iceCandidate);
})


socket.on("offer", (offer) => {
    if (!creator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidateFunc;
        rtcPeerConnection.ontrack = onTrackFunc;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream); // For audio track
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream); // For video track
        rtcPeerConnection.setRemoteDescription(offer)
        rtcPeerConnection.createAnswer(
            function (answer) {
                rtcPeerConnection.setLocalDescription(answer);
                socket.emit('answer', answer, roomName);
            },
            function (err) {
                console.log("Error:", err);
            }
        )
    }
})


socket.on("answer", (answer) => {
    rtcPeerConnection.setRemoteDescription(answer);
})

function onIceCandidateFunc(event) {
    if (event.candidate) {
        socket.emit('candidate', event.candidate, roomName);
    }
}

function onTrackFunc(event) {
    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = function (e) {
        peerVideo.play();
    }
}