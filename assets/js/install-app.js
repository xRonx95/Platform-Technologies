/* =========================================================
   PLATFORM TECHNOLOGIES
   Android APK / iPhone Install Notification
   File: assets/js/install-app.js

   Features:
   - Shows popup on Android
   - Shows popup on iPhone / iPad
   - Shows popup on desktop for testing
   - Shows again after every page refresh
   - Automatically creates popup HTML if missing
========================================================= */

(function () {
    "use strict";

    /* =====================================================
       APPLICATION SETTINGS
    ===================================================== */

    const APP_NAME = "Platform Technologies";

    const APK_VERSION = "v1.0.0";

    const APK_FILE_NAME =
        "Platform-Technologies-v1.0.0.apk";

    /*
     * Your APK is located here:
     *
     * Platform Technologies/
     * └── Download/
     *     └── Platform-Technologies-v1.0.0.apk
     *
     * Starting with "/" makes the path work even when
     * the current HTML page is inside another folder.
     */
    const APK_PATH =
        "/Download/Platform-Technologies-v1.0.0.apk";


    /* =====================================================
       CREATE INSTALL POPUP HTML AUTOMATICALLY
    ===================================================== */

    function createInstallDialog() {

        /*
         * Check if the popup already exists.
         */
        let dialog =
            document.getElementById(
                "appInstallDialog"
            );


        /*
         * If it already exists in index.html,
         * do not create another one.
         */
        if (dialog) {

            return dialog;

        }


        /*
         * Create dialog.
         */
        dialog =
            document.createElement(
                "dialog"
            );


        dialog.id =
            "appInstallDialog";


        dialog.className =
            "app-install-dialog";


        dialog.setAttribute(
            "aria-labelledby",
            "appInstallTitle"
        );


        dialog.setAttribute(
            "aria-describedby",
            "appInstallDescription"
        );


        /*
         * Popup HTML.
         */
        dialog.innerHTML = `

            <div class="app-install-card">


                <!-- CLOSE BUTTON -->

                <button
                    type="button"
                    class="app-install-close"
                    id="appInstallClose"
                    aria-label="Close"
                >
                    &times;
                </button>



                <!-- APPLICATION ICON -->

                <div class="app-install-icon-wrap">

                    <img
                        src="/assets/icons/icon-192.png"
                        alt="${APP_NAME}"
                        onerror="this.style.display='none';"
                    >

                </div>



                <!-- SMALL LABEL -->

                <p class="app-install-eyebrow">

                    Mobile Application

                </p>



                <!-- TITLE -->

                <h2 id="appInstallTitle">

                    Get ${APP_NAME}

                </h2>



                <!-- DESCRIPTION -->

                <p
                    class="app-install-description"
                    id="appInstallDescription"
                >

                    Install Platform Technologies
                    for easier access.

                </p>



                <!-- PLATFORM -->

                <div
                    class="app-install-platform"
                    id="appInstallPlatform"
                >

                    Detecting your device...

                </div>



                <!-- BUTTONS -->

                <div class="app-install-actions">


                    <button
                        type="button"
                        class="app-install-primary"
                        id="appInstallPrimary"
                    >

                        Continue

                    </button>


                    <button
                        type="button"
                        class="app-install-secondary"
                        id="appInstallLater"
                    >

                        Not Now

                    </button>


                </div>



                <!-- IPHONE INSTRUCTIONS -->

                <div
                    class="app-install-help"
                    id="appInstallHelp"
                    hidden
                ></div>



                <!-- INFORMATION -->

                <p
                    class="app-install-note"
                    id="appInstallNote"
                ></p>


            </div>

        `;


        /*
         * Put popup inside body.
         */
        document.body.appendChild(
            dialog
        );


        return dialog;

    }


    /* =====================================================
       START INSTALL POPUP
    ===================================================== */

    function initializeInstallPopup() {


        /* =================================================
           CREATE / GET DIALOG
        ================================================= */

        const dialog =
            createInstallDialog();



        /* =================================================
           GET POPUP ELEMENTS
        ================================================= */

        const title =
            document.getElementById(
                "appInstallTitle"
            );


        const description =
            document.getElementById(
                "appInstallDescription"
            );


        const platform =
            document.getElementById(
                "appInstallPlatform"
            );


        const primaryButton =
            document.getElementById(
                "appInstallPrimary"
            );


        const laterButton =
            document.getElementById(
                "appInstallLater"
            );


        const closeButton =
            document.getElementById(
                "appInstallClose"
            );


        const help =
            document.getElementById(
                "appInstallHelp"
            );


        const note =
            document.getElementById(
                "appInstallNote"
            );



        /* =================================================
           USER AGENT
        ================================================= */

        const userAgent =

            navigator.userAgent ||

            navigator.vendor ||

            window.opera ||

            "";



        /* =================================================
           ANDROID DETECTION
        ================================================= */

        const isAndroid =

            /Android/i.test(
                userAgent
            );



        /* =================================================
           IPHONE / IPAD DETECTION
        ================================================= */

        const isIOS =

            /iPhone|iPad|iPod/i.test(
                userAgent
            )

            ||

            (

                navigator.platform ===
                    "MacIntel"

                &&

                navigator.maxTouchPoints >
                    1

            );



        /* =================================================
           SAFARI DETECTION
        ================================================= */

        const isSafari =

            /Safari/i.test(
                userAgent
            )

            &&

            !/CriOS/i.test(
                userAgent
            )

            &&

            !/FxiOS/i.test(
                userAgent
            )

            &&

            !/EdgiOS/i.test(
                userAgent
            );



        /* =================================================
           CHECK IF ALREADY INSTALLED AS PWA
        ================================================= */

        const isStandalone =

            (

                window.matchMedia

                &&

                window.matchMedia(
                    "(display-mode: standalone)"
                ).matches

            )

            ||

            window.navigator
                .standalone === true;



        /* =================================================
           CLOSE POPUP
        ================================================= */

        function closeInstallDialog() {


            if (

                typeof dialog.close ===
                    "function"

                &&

                dialog.open

            ) {

                dialog.close();

            }

            else {

                dialog.removeAttribute(
                    "open"
                );

            }

        }



        /* =================================================
           OPEN POPUP
        ================================================= */

        function openInstallDialog() {


            try {


                if (

                    typeof dialog.showModal ===
                        "function"

                ) {


                    if (!dialog.open) {

                        dialog.showModal();

                    }


                }

                else {


                    dialog.setAttribute(
                        "open",
                        ""
                    );


                }


            }

            catch (error) {


                console.error(
                    "Install popup error:",
                    error
                );


                dialog.setAttribute(
                    "open",
                    ""
                );


            }

        }



        /* =================================================
           DOWNLOAD ANDROID APK
        ================================================= */

        function downloadAndroidAPK() {


            /*
             * Create invisible download link.
             */
            const downloadLink =
                document.createElement(
                    "a"
                );


            /*
             * APK path.
             */
            downloadLink.href =
                APK_PATH;


            /*
             * Download filename.
             */
            downloadLink.download =
                APK_FILE_NAME;


            downloadLink.rel =
                "noopener";


            downloadLink.style.display =
                "none";


            /*
             * Add to page.
             */
            document.body.appendChild(
                downloadLink
            );


            /*
             * Start download.
             */
            downloadLink.click();


            /*
             * Remove temporary link.
             */
            setTimeout(
                function () {

                    downloadLink.remove();

                },
                100
            );


            /*
             * Update button.
             */
            if (primaryButton) {

                primaryButton.textContent =
                    "APK Download Started";

            }


            /*
             * Show information.
             */
            if (note) {

                note.innerHTML =

                    "After downloading, open <strong>" +

                    APK_FILE_NAME +

                    "</strong> from your Downloads folder to install it.";

            }

        }



        /* =================================================
           IPHONE INSTALL INSTRUCTIONS
        ================================================= */

        function showIOSInstructions() {


            if (!help) {

                return;

            }


            help.hidden =
                false;



            /*
             * Safari
             */
            if (isSafari) {


                help.innerHTML = `

                    <strong>
                        Install ${APP_NAME}
                        on iPhone / iPad
                    </strong>


                    <ol>

                        <li>

                            Tap the
                            <strong>
                                Share
                            </strong>
                            button in Safari.

                        </li>


                        <li>

                            Scroll down through
                            the Share menu.

                        </li>


                        <li>

                            Tap
                            <strong>
                                Add to Home Screen
                            </strong>.

                        </li>


                        <li>

                            Check the application
                            name.

                        </li>


                        <li>

                            Tap
                            <strong>
                                Add
                            </strong>.

                        </li>


                        <li>

                            Platform Technologies
                            will appear on your
                            Home Screen.

                        </li>

                    </ol>

                `;


            }

            /*
             * Chrome / Edge / other browser on iPhone
             */
            else {


                help.innerHTML = `

                    <strong>
                        Open this website
                        using Safari
                    </strong>


                    <ol>

                        <li>

                            Open
                            <strong>
                                Safari
                            </strong>.

                        </li>


                        <li>

                            Visit this website
                            again.

                        </li>


                        <li>

                            Tap
                            <strong>
                                Share
                            </strong>.

                        </li>


                        <li>

                            Tap
                            <strong>
                                Add to Home Screen
                            </strong>.

                        </li>


                        <li>

                            Tap
                            <strong>
                                Add
                            </strong>.

                        </li>

                    </ol>

                `;


            }


            if (primaryButton) {

                primaryButton.textContent =
                    "Instructions Shown";

            }

        }



        /* =================================================
           CONFIGURE ANDROID
        ================================================= */

        function configureAndroid() {


            if (title) {

                title.textContent =
                    "Download " +
                    APP_NAME;

            }


            if (description) {

                description.textContent =

                    "Install the Platform Technologies Android application directly on your phone.";

            }


            if (platform) {

                platform.innerHTML =

                    "🤖 Android detected"

                    +

                    "&nbsp;&nbsp;•&nbsp;&nbsp;"

                    +

                    "APK "

                    +

                    APK_VERSION;

            }


            if (primaryButton) {


                primaryButton.textContent =
                    "Download Android APK";


                primaryButton.onclick =
                    function () {

                        downloadAndroidAPK();

                    };


            }


            if (help) {

                help.hidden =
                    true;

                help.innerHTML =
                    "";

            }


            if (note) {

                note.innerHTML =

                    "Android may ask permission to install apps from your browser or Files application.";

            }

        }



        /* =================================================
           CONFIGURE IPHONE / IPAD
        ================================================= */

        function configureIOS() {


            if (title) {

                title.textContent =
                    "Install " +
                    APP_NAME;

            }


            if (description) {

                description.textContent =

                    "Add Platform Technologies to your iPhone or iPad Home Screen for app-like access.";

            }


            if (platform) {

                platform.innerHTML =

                    " iPhone / iPad detected"

                    +

                    "&nbsp;&nbsp;•&nbsp;&nbsp;"

                    +

                    "Web App";

            }


            if (primaryButton) {


                if (isStandalone) {

                    primaryButton.textContent =
                        "View Install Instructions";

                }

                else {

                    primaryButton.textContent =
                        "Install on iPhone / iPad";

                }


                primaryButton.onclick =
                    function () {

                        showIOSInstructions();

                    };


            }


            if (help) {

                help.hidden =
                    true;

                help.innerHTML =
                    "";

            }


            if (note) {

                note.innerHTML =

                    "iPhone and iPad cannot install Android <strong>.apk</strong> files. Use Safari → Share → Add to Home Screen instead.";

            }

        }



        /* =================================================
           CONFIGURE DESKTOP
        ================================================= */

        function configureDesktop() {


            if (title) {

                title.textContent =
                    "Get " +
                    APP_NAME;

            }


            if (description) {

                description.textContent =

                    "Platform Technologies is available for Android and can also be added to the iPhone or iPad Home Screen.";

            }


            if (platform) {

                platform.innerHTML =

                    "💻 Desktop browser detected"

                    +

                    "&nbsp;&nbsp;•&nbsp;&nbsp;"

                    +

                    "Install Preview";

            }


            if (primaryButton) {


                primaryButton.textContent =
                    "Download Android APK";


                primaryButton.onclick =
                    function () {

                        downloadAndroidAPK();

                    };


            }


            if (help) {


                help.hidden =
                    false;


                help.innerHTML = `

                    <strong>
                        iPhone / iPad
                    </strong>


                    <ol>

                        <li>

                            Open the website
                            using Safari.

                        </li>


                        <li>

                            Tap
                            <strong>
                                Share
                            </strong>.

                        </li>


                        <li>

                            Tap
                            <strong>
                                Add to Home Screen
                            </strong>.

                        </li>


                        <li>

                            Tap
                            <strong>
                                Add
                            </strong>.

                        </li>

                    </ol>

                `;

            }


            if (note) {

                note.innerHTML =

                    "The APK is for Android only. iPhone and iPad users should install the website through Safari.";

            }

        }



        /* =================================================
           DETECT DEVICE AND CONFIGURE POPUP
        ================================================= */

        if (isAndroid) {


            configureAndroid();


        }

        else if (isIOS) {


            configureIOS();


        }

        else {


            /*
             * This is intentionally enabled
             * so you can also see/test the
             * popup on Windows Chrome.
             */
            configureDesktop();


        }



        /* =================================================
           NOT NOW BUTTON
        ================================================= */

        if (laterButton) {


            laterButton.addEventListener(

                "click",

                function () {

                    closeInstallDialog();

                }

            );


        }



        /* =================================================
           X CLOSE BUTTON
        ================================================= */

        if (closeButton) {


            closeButton.addEventListener(

                "click",

                function () {

                    closeInstallDialog();

                }

            );


        }



        /* =================================================
           CLOSE WHEN CLICKING OUTSIDE
        ================================================= */

        dialog.addEventListener(

            "click",

            function (event) {


                if (

                    event.target ===
                    dialog

                ) {

                    closeInstallDialog();

                }


            }

        );



        /* =================================================
           ESCAPE KEY
        ================================================= */

        dialog.addEventListener(

            "cancel",

            function (event) {


                event.preventDefault();


                closeInstallDialog();


            }

        );



        /* =================================================
           SHOW POPUP
        ================================================= */

        /*
         * No localStorage.
         * No sessionStorage.
         *
         * Therefore the popup appears again
         * whenever the page is refreshed.
         */
        setTimeout(

            function () {

                openInstallDialog();

            },

            450

        );

    }



    /* =====================================================
       WAIT UNTIL HTML HAS LOADED
    ===================================================== */

    if (

        document.readyState ===
        "loading"

    ) {


        document.addEventListener(

            "DOMContentLoaded",

            function () {

                initializeInstallPopup();

            }

        );


    }

    else {


        initializeInstallPopup();


    }


})();