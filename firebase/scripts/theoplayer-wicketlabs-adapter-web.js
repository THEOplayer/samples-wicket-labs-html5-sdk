function initFirebase(player, userId, debug, sendData) {

    let firstPlayDone = false, seekingTime = 0;
    let duration = 0;
    let didPause = false;

    // variables for measuring the progress event
    let markers = []
    let previousPercentage = 0;
    let previousCurrentTime = 0;
    let thirtySecs = false;

    // Your web app's Firebase configuration
    // TODO: ENTER THIS
    let firebaseConfig = {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: "",
        measurementId: ""
    };

    function log(event, data) {
        if (sendData) {
            firebase.analytics().logEvent('video_playback', data);
        }
        if (debug) {
            console.info("Logged new event to Firebase Analytics.");
            console.info(event, data);
        }
    }

    function getDuration() {
        return duration;
    }

    function getData(event, position, duration, progress) {
        progress = progress;
        let percentage =  Math.floor((player.currentTime / getDuration())*10)*10;
        if (percentage == 100 && event != "progress") {
            return false;
        } else if (percentage == 100 && event == "progress") {
            progress = 100;
        } else if (event == "progress") {
            progress = progress || ((!thirtySecs && player.currentTime < 31) ? (Math.floor((30 / getDuration())*10000)/100) : percentage);
        } else {
            progress = progress || Math.floor((player.currentTime / getDuration())*10000)/100;
        }
        return {
            video_event: event,
            video_id: 'tt7984734',
            video_title: 'The Lighthouse',
            video_position: Math.floor((position || player.currentTime)),
            video_duration: Math.floor((duration || getDuration())),
            video_progress: progress
        }
    }


    function start() {
        duration = player.duration;
        let data = getData('start', 0, null, 0);
        log('start', data);
    }

    function pause() {
        let data = getData('pause');
        if (data) {
            log('pause', data);
            didPause = true;
        }
    }

    function resume() {
        if (firstPlayDone && didPause) {
            let data = getData('resume');
            log('resume', data);
            didPause = false;
        }
    }

    function seeked(e) {
        if (firstPlayDone && (Math.abs(seekingTime-e.currentTime) > 1)) {
            if (e.currentTime > seekingTime) {
                fastForward();
            } else if (e.currentTime < seekingTime) {
                rewind();
            }
        }
    }

    function rewind() {
        let data = getData('rewind');
        log('rewind', data);
    }

    function fastForward() {
        let data = getData('fastforward');
        log('fastforward', data);
    }

    function stop() {
        // if (!markers[11]) {
        //     markers[11] = true;
        //     let data = getData('progress', null, null, null, 100.0)
        //     log('progress', data);
        // }
        // let data = getData('stop');
        // log('stop', data);
    }

    // Out of scope for now
    function skip() {
        let data = getData('skip');
        log('skip', data);
    }

    function getPercentage() {
        return Math.round(player.currentTime / getDuration() * 10000)/100;
    }

    function progress() {
        let percentage = getPercentage();
        if (percentage < previousPercentage) {
            markers = []; // unset markers
            if (thirtySecs && (player.currentTime < 30)) {
                thirtySecs = false;
            }
        }

        let previousClosestProg = Math.floor(previousPercentage/10);
        let closestProg = Math.floor(percentage/10);
        let percDif = percentage - (closestProg * 10);
        if ((closestProg > previousClosestProg) && (percDif > 0 && percDif < 1) && (closestProg > 0) && !markers[closestProg]) {
            markers[closestProg] = true;
            let data = getData('progress');
            log('progress', data);
        }
        let timeDif = player.currentTime - previousCurrentTime;
        if (!thirtySecs && (player.currentTime >= 30 && previousCurrentTime < 30 && player.currentTime < 31) && (timeDif > 0 && timeDif < 1)) {
            let data = getData('progress');
            thirtySecs = true;
            log('progress', data);
        }
        previousPercentage = percentage;
        previousCurrentTime = player.currentTime;
    }

    function firstplaying() {
        player.removeEventListener('playing', firstplaying);
        start();
        firstPlayDone = true;
    }

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    firebase.analytics();
    firebase.analytics().setUserId(userId);

    player.addEventListener('sourcechange', function() {
        console.warn("New stream configured.");

        // unset variables on source change
        firstPlayDone = false; seekingTime = 0;
        duration = 0;
        didPause = false;
        markers = []
        previousPercentage = 0;
        previousCurrentTime = 0;
        thirtySecs = false;

        player.removeEventListener('playing', firstplaying);
        player.addEventListener('playing', firstplaying);
        player.removeEventListener('pause', pause);
        player.addEventListener('pause', pause);
        player.removeEventListener('playing', resume);
        player.addEventListener('playing', resume);
        player.removeEventListener('ended', stop);
        player.addEventListener('ended', stop);
        player.removeEventListener('timeupdate', progress);
        player.addEventListener('timeupdate', progress);
        player.removeEventListener('seeked', seeked);
        player.addEventListener('seeked', seeked);
        let playheadPosition = 0;
        player.addEventListener('timeupdate', function(e) {
            playheadPosition = e.currentTime;
        });
        player.addEventListener('seeking', function(e) {
            seekingTime = playheadPosition;
        });
    });

}