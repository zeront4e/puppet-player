/*
Copyright 2021 zeront4e (https://github.com/zeront4e)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

//Constants.
const BUTTON_SOUND_FILE_PATH = "button-click-sound.mp3";
const WELCOME_SOUND_FILE_PATH = "welcome.mp3";

const MAIN_MENU_GUI = "main-menu-gui";
const PLAYER_GUI = "player-gui";
const CONTENTS_GUI = "contents-gui";
const EXTRA_CONTENTS_GUI = "extra-contents-gui";
const SETTINGS_GUI = "settings-gui";

const COVER_IMAGE_NAME = "cover";
const BACKGROUND_IMAGE_NAME = "background-image";
const BACKGROUND_VIDEO_NAME = "background-video";
const IMAGE_FILE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
const VIDEO_FILE_EXTENSIONS = ['.mkv', '.avi', '.mp4', '.webm', '.mpeg'];

const LS_KEY_PLAYER_SETTINGS = "pppv-player-settings";
const LS_KEY_LAST_CONTENT_ID = "pppv-last-content-id";
const LS_KEY_LAST_CONTENT_TIMESTAMP = "pppv-last-content-timestamp";

const PLAYER_MOBILE_CONTROLS_ARRAY = [
    'play-small', 'play', 'current-time', 'progress', 
    'duration', 'mute', 'volume', 'captions', 'settings', 'fullscreen'
];

const PLAYER_CONTROLS_ARRAY = [
    'play-large', 'play', 'rewind', 'fast-forward', 'current-time', 'progress', 
    'duration', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
];

const {
    createApp
} = Vue

createApp({
    data: function() {
        return {
            //Common data variables.
            contentsHash: "",

            contentsMetaData: {},
            localization: {},

            contents: [],
            contentsIndex: 0,

            extraContents: [],
            extraContentsIndex: 0,

            coverImagePath: "",
            backgroundVideoPath: "",

            //Settings GUI variables.
            settingsPlayBackgroundVideo: true,
            settingsPlayBackgroundVideoSound: true,
            settingsPlayBackgroundVideoInAllMenus: false,
            settingsPlayerAutoplay: true,
            settingsPlayerEnterFullscreen: true,
            settingsEnterFullscreenAfterIntro: false,
            settingsAutoRestrictMobilePlayerGui: true,

            //General GUI variables.
            guiCurrentUI: MAIN_MENU_GUI,
            guiLastMenuUI: MAIN_MENU_GUI,

            //Player and player GUI variables.
            playerUsesContentsIndex: true,
            player: null,
            playerLastContentId: null,
            playerLastContentTimestamp: null
        }
    },
    computed: {
        showMainMenuMuteButton() {
            return !this.guiHideMainMenuUi && this.showBackgroundVideo;
        },
        showBackgroundVideo() {
            if(this.backgroundVideoPath.length === 0)
                return false;

            if(!this.guiHideMainMenuUi)
                return true;
            
            if(this.settingsPlayBackgroundVideoInAllMenus)
                return !this.guiHideContentsUi || !this.guiHideExtraContentsUi || !this.guiHideSettingsUi;
        },
        showBackToMenuButton() {
            return !this.guiHidePlayerUi || !this.guiHideContentsUi || !this.guiHideExtraContentsUi || !this.guiHideSettingsUi;
        },
        guiHideMainMenuUi() {
            return this.guiCurrentUI !== MAIN_MENU_GUI;
        },
        guiHidePlayerUi() {
            return this.guiCurrentUI !== PLAYER_GUI;
        },
        guiHideContentsUi() {
            return this.guiCurrentUI !== CONTENTS_GUI;
        },
        guiHideExtraContentsUi() {
            return this.guiCurrentUI !== EXTRA_CONTENTS_GUI;
        },
        guiHideSettingsUi() {
            return this.guiCurrentUI !== SETTINGS_GUI;
        },  
        isNextContentAvailable() {
            if(this.playerUsesContentsIndex) {
                return this.contents.length > 1 && this.contentsIndex < this.contents.length - 1;
            }
            else {
                return this.extraContents.length > 1 && this.extraContentsIndex < this.extraContents.length - 1;
            }
        },
        isPreviousContentAvailable() {
            if(this.playerUsesContentsIndex) {
                return this.contents.length > 1 && this.contentsIndex > 0;
            }
            else {
                return this.extraContents.length > 1 && this.extraContentsIndex > 0;
            }
        },
        playerTitle() {
            if(this.playerUsesContentsIndex) {
                if(this.contents.length === 0)
                    return "";

                return this.contents[this.contentsIndex].contentTitle;
            }
            else {
                if(this.extraContents.length === 0)
                    return "";

                return this.extraContents[this.extraContentsIndex].contentTitle;
            }
        },
        mainMenuPlayerStorageAvailable() {
            const storableEntryAvailable = this.playerLastContentId != null && this.playerLastContentTimestamp != null;

            if(storableEntryAvailable) {
                localStorage.setItem(LS_KEY_LAST_CONTENT_ID + this.contentsHash, "" + this.playerLastContentId);
                localStorage.setItem(LS_KEY_LAST_CONTENT_TIMESTAMP + this.contentsHash, "" + this.playerLastContentTimestamp);
            }

            return storableEntryAvailable;
        }
    },
    beforeMount() {
        //Load the initial data, as soon as possible.
        this.loadAndSetupInitialData();
    },
    methods: {
        onBtnClearLocalStorage: function() {
            this.playButtonSound();

            localStorage.setItem(LS_KEY_LAST_CONTENT_ID + this.contentsHash, null);
            localStorage.setItem(LS_KEY_LAST_CONTENT_TIMESTAMP + this.contentsHash, null);

            this.playerLastContentId = null;
            this.playerLastContentTimestamp = null;

            iziToast.show({
                title: this.returnLocalizationString("deletedStoredSettings"),
                message: this.returnLocalizationString("allStoredSettingsWereDeleted"),
                theme: 'dark',
                position: 'topCenter',
                timeout: 4000
            });
        },
        toggleBackgroundVideoSound: function(enableSound) {
            this.settingsPlayBackgroundVideoSound = enableSound;

            this.storeSettings();

            if(enableSound)
                document.getElementById("background-video").volume = 1;
        },
        storeSettings: function() {
            const settingsObject = {};
            settingsObject.settingsPlayBackgroundVideo = this.settingsPlayBackgroundVideo;
            settingsObject.settingsPlayBackgroundVideoSound = this.settingsPlayBackgroundVideoSound;
            settingsObject.settingsPlayBackgroundVideoInAllMenus = this.settingsPlayBackgroundVideoInAllMenus;
            settingsObject.settingsPlayerAutoplay = this.settingsPlayerAutoplay;
            settingsObject.settingsPlayerEnterFullscreen = this.settingsPlayerEnterFullscreen;
            settingsObject.settingsEnterFullscreenAfterIntro = this.settingsEnterFullscreenAfterIntro;
            settingsObject.settingsAutoRestrictMobilePlayerGui = this.settingsAutoRestrictMobilePlayerGui;

            const settingsObjectString = JSON.stringify(settingsObject);

            localStorage.setItem(LS_KEY_PLAYER_SETTINGS, settingsObjectString);
        },
        loadSettings: function() {
            const playerSettingsString = localStorage.getItem(LS_KEY_PLAYER_SETTINGS);

            if(playerSettingsString != null) {
                const settingsObject = JSON.parse(playerSettingsString);

                this.settingsPlayBackgroundVideo = settingsObject.settingsPlayBackgroundVideo;
                this.settingsPlayBackgroundVideoSound = settingsObject.settingsPlayBackgroundVideoSound;
                this.settingsPlayBackgroundVideoInAllMenus = settingsObject.settingsPlayBackgroundVideoInAllMenus;
                this.settingsPlayerAutoplay = settingsObject.settingsPlayerAutoplay;
                this.settingsPlayerEnterFullscreen = settingsObject.settingsPlayerEnterFullscreen;
                this.settingsEnterFullscreenAfterIntro = settingsObject.settingsEnterFullscreenAfterIntro;
                this.settingsAutoRestrictMobilePlayerGui = settingsObject.settingsAutoRestrictMobilePlayerGui;
            }
        },
        onBtnShowSettings: function() {
            this.playButtonSound();

            this.guiLastMenuUI = MAIN_MENU_GUI;
            this.guiCurrentUI = SETTINGS_GUI;

            if(!this.settingsPlayBackgroundVideoInAllMenus) {
                this.pauseBackgroundVideoIfPresent();
            }
        },
        onBtnContinueToMainMenu: function() {
            if(this.settingsEnterFullscreenAfterIntro) {
                document.body.requestFullscreen();
            }

            //Unlock WEB-Audio.
            this.playAudio(BUTTON_SOUND_FILE_PATH, 1, () => {
                this.playAudio(WELCOME_SOUND_FILE_PATH, 1, () => {
                    this.playBackgroundVideoIfPresent();
                });
            });

            //Play transition aninmation and hide intro GUI.
            let oneTimeEventTriggered = false;

            document.addEventListener("animationend", function (event) {    
                if(event.animationName === "intro-fade-out-animation") {
                    event.target.style.display = "none";

                    if(!oneTimeEventTriggered) {
                        oneTimeEventTriggered = true;

                        //Enable the user to scroll, AFTER the intro is hidden.
                        document.body.style.overflowY = "visible";

                        //Hide the useless intro components.
                        setTimeout(() => {
                            document.getElementById("introContainer").style.display = "none";
                        }, 3000);
                    }
                }
            });

            document.getElementById("introContainer").classList.add("slide-up");
            document.getElementById("introAnimation").classList.add("intro-fade-out");
            document.getElementById("introImage").classList.add("intro-fade-out");
            document.getElementById("introButton").classList.add("intro-fade-out");
        },
        onBtnPlayFirstContent: function() {
            this.playButtonSound();

            this.guiLastMenuUI = MAIN_MENU_GUI;

            this.contentsIndex = 0;

            this.playContent(this.contents[0], true, this.settingsPlayerEnterFullscreen, 0);
        },
        onBtnPlayLastPlayedContent: function() {
            if(this.playerLastContentId != null && this.playerLastContentTimestamp != null) {
                this.playButtonSound();

                this.playerUsesContentsIndex = true;
                this.contentsIndex = this.playerLastContentId;

                this.playContent(this.contents[this.playerLastContentId], true, this.settingsPlayerEnterFullscreen, 
                    this.playerLastContentTimestamp);
            }
            else {
                this.onBtnPlayFirstContent();
            }
        },
        onBtnShowEpisodesMenu: function() {
            this.playButtonSound();

            this.playerUsesContentsIndex = true;
            
            this.guiLastMenuUI = MAIN_MENU_GUI;
            this.guiCurrentUI = CONTENTS_GUI;

            if(!this.settingsPlayBackgroundVideoInAllMenus) {
                this.pauseBackgroundVideoIfPresent();
            }
        },
        onBtnShowExtraContentsMenu: function() {
            this.playButtonSound();
            
            this.playerUsesContentsIndex = false;

            this.guiLastMenuUI = MAIN_MENU_GUI;
            this.guiCurrentUI = EXTRA_CONTENTS_GUI;

            if(!this.settingsPlayBackgroundVideoInAllMenus) {
                this.pauseBackgroundVideoIfPresent();
            }
        },
        onBtnBackToMenuFromPlayer: function() {
            this.playButtonSound();

            //Store settings, if the settings GUI was shown.
            if(this.guiCurrentUI === SETTINGS_GUI) {
                this.storeSettings();
            }

            //Play background video, if wanted and present.
            if(this.settingsPlayBackgroundVideoInAllMenus || this.guiLastMenuUI === MAIN_MENU_GUI) {
                this.playBackgroundVideoIfPresent();
            }

            //Return to the last menu GUI.
            this.guiCurrentUI = this.guiLastMenuUI;

            //Reset the last shown menu to the main menu.
            if(this.guiLastMenuUI !== MAIN_MENU_GUI) {
                this.guiLastMenuUI = MAIN_MENU_GUI;
            }

            //Pause player, if present.
            if(this.player != null) {
                this.player.pause();
            }
        },
        onBtnBackToMenuFromEpisodes: function() {
            this.playButtonSound();

            this.guiCurrentUI = MAIN_MENU_GUI;
        },
        onBtnPlaySelectedContent: function(selectedContent, index) {
            this.playButtonSound(); 

            if(this.playerUsesContentsIndex) {
                this.guiLastMenuUI = CONTENTS_GUI;

                this.contentsIndex = index;
            }
            else {
                this.guiLastMenuUI = EXTRA_CONTENTS_GUI;

                this.extraContentsIndex = index;
            }

            this.playContent(selectedContent, true, this.settingsPlayerEnterFullscreen, 0);
        },
        onBtnPlayPreviousContent: function() {
            this.playButtonSound();

            if(this.playerUsesContentsIndex) {
                this.contentsIndex--;
                this.playContent(this.contents[this.contentsIndex], true, false, 0);
            }
            else {
                this.extraContentsIndex--;
                this.playContent(this.extraContents[this.extraContentsIndex], true, false, 0);
            }
        },
        onBtnPlayNextContent: function() {
            this.playButtonSound();

            if(this.playerUsesContentsIndex) {
                this.contentsIndex++;
                this.playContent(this.contents[this.contentsIndex], true, false, 0);
            }
            else {
                this.extraContentsIndex++;
                this.playContent(this.extraContents[this.extraContentsIndex], true, false, 0);
            }
        },
        fetchJson: function(jsonPath) {
            const timestamp = new Date().getTime();
            const finalJsonPath = jsonPath + "?cachebreaker=" + timestamp;

            const promise = new Promise((resolve, reject) => {
                fetch(finalJsonPath)
                    .then(res => res.json())
                    .then(data => {
                        resolve(data);
                    })
                    .catch(error => {
                        console.error("Unable to fetch \"" + finalJsonPath + "\" as JSON. Cause:");
                        console.error(error);

                        reject(error);
                    });
            });

            return promise;
        },
        fetchMultipleJson: function(jsonPaths) {
            const promise = new Promise((resolve, reject) => {
                let jsonElements = [];
                let jsonElementIndex = 0;

                const performSingleFetch = () => {
                    if(jsonElementIndex != jsonPaths.length) {
                        let tmpJsonPath = jsonPaths[jsonElementIndex++];

                        this.fetchJson(tmpJsonPath).then(json => {
                            jsonElements.push(json);
                            performSingleFetch();
                        }).catch(error => {
                            reject(error);
                        });
                    }
                    else {
                        resolve(jsonElements);
                    }
                };

                performSingleFetch();
            });

            return promise;
        },
        playContent: function(content, instantPlayback, useFullscreen, startTime, hideControls) {
            if(this.player === null) {
                //Create a new player element here, because we assumably need the permission by the user (click event).
                const isMobileBrowser = function() {
                    const identifierString = navigator.userAgent || navigator.vendor || window.opera;

                    return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(identifierString) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(identifierString.substr(0, 4));
                };
                
                let controls = PLAYER_CONTROLS_ARRAY;

                if(this.settingsAutoRestrictMobilePlayerGui && isMobileBrowser()) {
                    controls = PLAYER_MOBILE_CONTROLS_ARRAY;
                }

                this.player = new Plyr("#plyr-video", {
                    title: content.contentDescription,
                    controls: controls,
                    iconUrl: "static/plyr.svg",
                    blankVideo: "static/blank.mp4"
                });

                let playerIntervalId = null;

                this.player.on("playing", (event) => {
                    if(playerIntervalId == null && this.playerUsesContentsIndex) {    
                        playerIntervalId = setInterval(() => {
                            this.playerLastContentId = this.contentsIndex;
                            this.playerLastContentTimestamp = this.player.currentTime * 1000;
                        }, 500);
                    }
                });

                this.player.on("pause", (event) => {
                    if(playerIntervalId != null) {
                        clearInterval(playerIntervalId);

                        playerIntervalId = null;
                    }
                });

                this.player.on("ended", (event) => {
                    if(playerIntervalId != null) {
                        clearInterval(playerIntervalId);

                        playerIntervalId = null;
                    }

                    if(this.settingsPlayerAutoplay && this.isNextContentAvailable) {
                        if(this.playerUsesContentsIndex) {
                            this.contentsIndex++;

                            this.playContent(this.contents[this.contentsIndex], true, 
                                this.player.fullscreen.active, 0, true);
                        }
                        else {
                            this.extraContentsIndex++;

                            this.playContent(this.extraContents[this.extraContentsIndex], true, 
                                this.player.fullscreen.active, 0, true);
                        }
                    }
                });
            }

            //Set the current content to play.
            this.player.source = {
                type: 'video',
                title: content.contentTitle,
                sources: [
                    {
                        src: content.contentPath
                    }
                ]
            };

            //Pause background video (force pause).
            if(this.settingsPlayBackgroundVideo)
                document.getElementById("background-video").pause();

            //Show the player UI.
            if(this.guiCurrentUI !== PLAYER_GUI)
                this.guiCurrentUI = PLAYER_GUI;

            //Hide controls temporary, if requested.
            if(hideControls) {
                document.querySelector("div.plyr__controls").style.display = "none";
                document.querySelector("button.plyr__control.plyr__control--overlaid").style.display = "none";
            }

            //Set player location, if necessary, or play instantaniously.
            if(startTime != null) {
                this.player.currentTime = Math.floor(startTime / 1000);

                //Workaround to ensure the correct start time.
                const timeStampIntervalId = setInterval(() => {
                    if(this.player.currentTime == Math.floor(startTime / 1000)) {
                        clearInterval(timeStampIntervalId);
                        
                        if(instantPlayback)
                            this.player.play();
                        
                        if(useFullscreen && !this.player.fullscreen.active)
                            this.player.fullscreen.enter();

                        if(hideControls) {
                            setTimeout(() => {
                                document.querySelector("div.plyr__controls").style.display = "";
                                document.querySelector("button.plyr__control.plyr__control--overlaid").style.display = "";
                            }, 2000);
                        }
                    } 
                    else {
                        this.player.currentTime = Math.floor(startTime / 1000);
                    }
                }, 200);
            }
            else {
                if(instantPlayback)
                    this.player.play();
                        
                if(useFullscreen && !this.player.fullscreen.active)
                    this.player.fullscreen.enter();

                if(hideControls) {
                    setTimeout(() => {
                        document.querySelector("div.plyr__controls").style.display = "";
                        document.querySelector("button.plyr__control.plyr__control--overlaid").style.display = "";
                    }, 2000);
                }
            }
        },
        checkBrowserCompatibility: function() {
            this.tryVideoPlayback("static/mkv-support-test.mkv").catch(error => {
                iziToast.show({
                    title: this.returnLocalizationString("missingMkvSupport"),
                    message: this.returnLocalizationString("pleaseUseACompatibleBrowser"),
                    theme: 'dark',
                    position: 'topCenter',
                    timeout: 7000
                });
            });
        },
        createJpegPreviewBlobFromVideo: function(fileUrlPath, seekPositionMilliseconds) {
            if(seekPositionMilliseconds == null || seekPositionMilliseconds < 0)
                seekPositionMilliseconds = 0;

            return new Promise((resolve, reject) => {
                const videoPlayer = document.createElement("video");
                videoPlayer.setAttribute("muted", "true");
                videoPlayer.setAttribute("playsinline", "true");
                videoPlayer.setAttribute("src", fileUrlPath);
                
                videoPlayer.addEventListener("error", (error) => {
                    reject(error);
                });
                
                videoPlayer.addEventListener("loadedmetadata", () => {
                    if(seekPositionMilliseconds === 0 || 
                        (videoPlayer.duration * 1000) < (seekPositionMilliseconds / 1000)) {
                        seekPositionMilliseconds = (videoPlayer.duration * 1000) / 3;
                    }

                    videoPlayer.addEventListener("seeked", () => {
                        const canvas = document.createElement("canvas");
                        canvas.width = videoPlayer.videoWidth;
                        canvas.height = videoPlayer.videoHeight;

                        const canvasContext = canvas.getContext("2d");
                        canvasContext.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
                        
                        canvasContext.canvas.toBlob(
                            blob => {
                                resolve(blob);
                            },
                            "image/jpeg",
                            0.85 //JPEG compression level.
                        );
                    });

                    videoPlayer.currentTime = seekPositionMilliseconds / 1000;
                });

                videoPlayer.load();
            });
        },
        tryVideoPlayback: function(fileUrlPath) {
            return new Promise((resolve, reject) => {
                const videoPlayer = document.createElement("video");
                videoPlayer.setAttribute("muted", "true");
                videoPlayer.setAttribute("playsinline", "true");
                videoPlayer.setAttribute("src", fileUrlPath);
                
                videoPlayer.addEventListener("error", (error) => {
                    reject(error);
                });
                
                videoPlayer.addEventListener("loadeddata", () => {
                    resolve();
                });

                videoPlayer.load();
            });
        },
        millisecondsToTimeString: function(timestampMilliseconds) {
            //Calculate minutes and seconds.
            let passedMinutes = Math.floor(timestampMilliseconds / 1000 / 60);
            let passedSeconds = Math.floor(timestampMilliseconds / 1000 % 60);

            //Convert to string.
            passedMinutes = (passedMinutes < 10 ? "0" : "") + passedMinutes;
            passedSeconds = (passedSeconds < 10 ? "0" : "") + passedSeconds;

            let passedTimeString = passedMinutes + ":" + passedSeconds;

            return passedTimeString;
        },
        imageSrcFromBlobOrDefault: function(blob) {
            if(blob == null)
                return "thumbnail.jpg";

            return URL.createObjectURL(blob);
        },
        playButtonSound: function() {
            this.playAudio(BUTTON_SOUND_FILE_PATH, 1);
        },
        playAudio: function(filePath, volume, onAudioEnded) {
            let audio = new Audio(filePath);

            if(volume)
                audio.volume = volume;

            if(onAudioEnded) {
                audio.addEventListener("ended", (event) => {
                    onAudioEnded();
                });
            }

            audio.play();
        },
        playBackgroundVideoIfPresent: function() {
            if(this.settingsPlayBackgroundVideo) {
                const backgroundVideo = document.getElementById("background-video");
            
                //Try to play the video, after the pause succeeded.
                const playIntervalId = setInterval(() => {
                    if(backgroundVideo.dataset.pausePending !== "true") {
                        clearInterval(playIntervalId);

                        if(!backgroundVideo.paused)
                            return;

                        backgroundVideo.dataset.playPending = "true";

                        backgroundVideo.play().finally(() => {
                            if(this.settingsPlayBackgroundVideoSound) {
                                //Fadein of audio.
                                backgroundVideo.volume = 0;

                                const audioFadeInIntervalId = setInterval(() => {
                                    if(backgroundVideo.volume < 1) {
                                        let newAudioVolume = backgroundVideo.volume + 0.05;
    
                                        if(newAudioVolume > 1)
                                            newAudioVolume = 1;
                                        
                                        backgroundVideo.volume = newAudioVolume;
                                    }
                                    else {
                                        clearInterval(audioFadeInIntervalId);
                                        
                                        backgroundVideo.dataset.playPending = "false";
                                    }
                                }, 50);
                            }
                            else {
                                backgroundVideo.dataset.playPending = "false";
                            }
                        });
                    }
                }, 100);
            }
        },
        pauseBackgroundVideoIfPresent: function() {
            if(this.settingsPlayBackgroundVideo) {
                const backgroundVideo = document.getElementById("background-video");
            
                if(backgroundVideo.paused)
                    return;

                if(backgroundVideo.dataset.pausePending !== "true") {
                    //Try to pause video, after play event succeeded.
                    if(backgroundVideo.dataset.playPending !== "true") {
                        backgroundVideo.dataset.pausePending = "true";

                        //Fadeout of audio.
                        const audioFadeOutIntervalId = setInterval(() => {
                            if(backgroundVideo.volume > 0) {
                                let newAudioVolume = backgroundVideo.volume - 0.05;

                                if(newAudioVolume < 0)
                                    newAudioVolume = 0;
                                
                                backgroundVideo.volume = newAudioVolume;
                            }
                            else {
                                clearInterval(audioFadeOutIntervalId);
                                
                                backgroundVideo.pause();

                                backgroundVideo.dataset.pausePending = "false";
                            }
                        }, 50);
                    }
                }
            }
        },
        loadAndSetupInitialData: function() {
            //Load settings.
            this.loadSettings();

            //Load contents and meta-data.
            let setupStepsCount = 0;

            const tryToEnableContinueButton = () => {
                //Enable continue button if all data was loaded.
                if(++setupStepsCount === 7) {
                    document.getElementById("introLoadingAnimation").style.display = "none";
                    document.getElementById("introButton").style.display = "";
                }
            };

            this.fetchJson("/contents.json").then(contentsMetaData => {
                //Setup contents (preview and meta-data).
                this.setupContentData(contentsMetaData.contents).then(loadedContentsArray => {
                    this.contents = loadedContentsArray;
                    tryToEnableContinueButton();
                })
                .catch(error => {
                    console.error("Unable to load movie/series contents which are required to continue! Cause:");
                    console.error(error);

                    alert("Unable to load movie/series contents which are required to continue!");
                    location.reload();
                });

                //Setup extra-contents (preview and meta-data).
                this.setupContentData(contentsMetaData.extraContents).then(loadedExtraContentsArray => {
                    this.extraContents = loadedExtraContentsArray;
                })
                .catch(error => {
                    console.warn("Unable to load extra contents! Cause:");
                    console.warn(error);
                }).finally(() => tryToEnableContinueButton());

                //Calculate contents-hash.
                this.generateHashFromString(JSON.stringify(contentsMetaData)).then(hashString => {
                    this.contentsHash = hashString;

                    //Setup storage variables.
                    const lastContentId = localStorage.getItem(LS_KEY_LAST_CONTENT_ID + this.contentsHash);
                    const lastContentTimestamp = localStorage.getItem(LS_KEY_LAST_CONTENT_TIMESTAMP + this.contentsHash);
                    
                    if(lastContentId != null && lastContentTimestamp != null) {
                        this.playerLastContentId = parseInt(lastContentId);
                        this.playerLastContentTimestamp = parseInt(lastContentTimestamp);
                    }

                    tryToEnableContinueButton();
                })
                .catch(error => {
                    console.error("Unable to calculate contents-hash! Cause:");
                    console.error(error);

                    alert("Unable to calculate contents-hash!");
                    location.reload();
                });

                //Set global meta-data.
                this.contentsMetaData = contentsMetaData;
            })
            .catch(error => {
                console.error("Unable to load the file \"contents.json\" which is required to continue! Cause:");
                console.error(error);

                alert("Unable to load the file \"contents.json\" which is required to continue!");
                location.reload();
            });

            //Load localization.
            this.fetchJson("/localization.json").then(localization => {
                this.localization = localization;

                this.checkBrowserCompatibility();

                tryToEnableContinueButton();
            })
            .catch(error => {
                console.error("Unable to load the file \"localization.json\" which is required to continue! Cause:");
                console.error(error);

                alert("Unable to load the file \"localization.json\" which is required to continue!");
                location.reload();
            });

            //Load image/video resources.
            const logResourceError = function(error, fileName, fileExtensionsArray, logAsWarning) {
                let consoleFunction;

                if(logAsWarning) {
                    consoleFunction = "warn";
                }
                else {
                    consoleFunction = "error";
                }

                console[consoleFunction](error);
                console[consoleFunction]("Searched file name: " + fileName);

                console[consoleFunction]("Extensions:");
                console[consoleFunction](fileExtensionsArray);

                if(!logAsWarning) {
                    alert("Unable to find a resource which is required to continue! File name: " + fileName);
                    location.reload();
                }
            };

            //Set body overflow hidden to prevent scrolling in intro.
            document.body.style.overflowY = "hidden";

            this.findFileByExtensionTypes(COVER_IMAGE_NAME, IMAGE_FILE_EXTENSIONS)
                .then(coverImagePath => this.coverImagePath = coverImagePath)
                .catch(error => logResourceError(error, COVER_IMAGE_NAME, IMAGE_FILE_EXTENSIONS, false))
                .finally(() => tryToEnableContinueButton());

            this.findFileByExtensionTypes(BACKGROUND_IMAGE_NAME, IMAGE_FILE_EXTENSIONS).then(backgroundImageUrl => {
                const timestamp = new Date().getTime();
                const backgroundImagePath = backgroundImageUrl + "?cachebreaker=" + timestamp;

                document.body.style.background = "url(../" + backgroundImagePath + ") no-repeat center center fixed";
                document.body.style.backgroundPosition = "center center";
                document.body.style.backgroundSize = "cover";
                document.body.style.backgroundRepeat = "no-repeat";
                document.body.style.backgroundAttachment = "fixed";
            })
            .catch(error => logResourceError(error, BACKGROUND_IMAGE_NAME, IMAGE_FILE_EXTENSIONS, false))
            .finally(() => tryToEnableContinueButton());

            this.findFileByExtensionTypes(BACKGROUND_VIDEO_NAME, VIDEO_FILE_EXTENSIONS)
                .then(result => this.backgroundVideoPath = result)
                .catch(error => logResourceError(error, BACKGROUND_VIDEO_NAME, VIDEO_FILE_EXTENSIONS, true))
                .finally(() => tryToEnableContinueButton());
        },
        setupContentData: function(contentsArray) {
            const promise = new Promise((resolve, reject) => {
                let contentPaths = [];

                contentsArray.forEach(tmpContent => {
                    contentPaths.push(tmpContent.jsonPath);
                });

                this.fetchMultipleJson(contentPaths).then(loadedContentsAray => {
                    let subContentIndex = 0;

                    loadedContentsAray.forEach(tmpContentJsonData => {
                        let contentPath = contentsArray[subContentIndex].contentPath;
                        let jsonPath = contentsArray[subContentIndex].jsonPath;
                        
                        subContentIndex++;

                        tmpContentJsonData.contentPath = contentPath;
                        tmpContentJsonData.jsonPath = jsonPath;

                        tmpContentJsonData.previewBlob = null;

                        this.createJpegPreviewBlobFromVideo(contentPath).then(blob => {
                            tmpContentJsonData.previewBlob = blob;
                        })
                        .catch(error => {
                            console.warn("Unable to generate preview for content \"" + contentPath + "\".");
                            console.warn("Cause:");
                            console.warn(error);
                        });
                    });

                    resolve(loadedContentsAray);
                }).catch(error => {
                    reject(error);
                });
            });

            return promise;
        },
        returnLocalizationString: function(localizationString) {
            const foundLocalization = this.localization[localizationString];

            if(foundLocalization != null) {
                return foundLocalization;
            }
            else {
                return "NOT_LOCALIZED";
            }
        },
        findFileByExtensionTypes: function(fileName, fileExtensionsArray) {
            const promise = new Promise((resolve, reject) => {
                let currentFileEndingIndex = 0;
            
                const findFile = () => {
                    const resourcePath = fileName + fileExtensionsArray[currentFileEndingIndex];
                    
                    const timestamp = new Date().getTime();
                    const finalResourcePath = resourcePath + "?cachebreaker=" + timestamp;

                    fetch(finalResourcePath).then(fetchResult => {
                        if (fetchResult.ok) {
                            resolve(resourcePath);
                        }
                        else {
                            if(currentFileEndingIndex === fileExtensionsArray.length - 1) {
                                reject(new Error("Unable to find any file for the given prefix variables!"));
                            } 
                            else {
                                currentFileEndingIndex++;
                                findFile();
                            }
                        }
                    });
                };

                findFile();
            });

            return promise;
        },
        generateHashFromString: function(string) {
            const promise = new Promise((resolve, reject) => {
                try {
                    resolve(sha256(string));
                }
                catch(error) {
                    reject(error);
                }
            });

            return promise;
        }
    }
}).mount('#appContainer')