# puppet-player
![puppetPlayerLogo](https://github.com/zeront4e/puppet-player/blob/main/static/puppetPlayerLogo.png?raw=true)

A web based BluRay- or DVD-menu like alternative.

![gui-screenshots](https://github.com/zeront4e/puppet-player/blob/main/static/gui-screenshots.jpg?raw=true)

## Features 📦
* Create a menu for recorded movies, series or other content
* Includes a main menu, a settings menu, a main content menu and an extra content menu
* Configuration via JSON, without programming knowledge
* Integrated web server to play content locally or over the local network
* Responsive GUI
* Auto-play for main content and extra content, once a video is finished
* Automatic preview generation in content menus
* Storage of the last played content and all user-settings
* Localization support (English and German is already included)
* Customizable background-video (optional), background-image and cover-image, displayed in all menus

# Usage ⚙
To test the software, or to create a custom menu, download the content of this repository. The relevant files are located in the "player" directory.

## Access the content locally or over the local network
* Execute the file "Linux-Start.sh" or the file "Windows-Start.bat" in the "player" directory, depending on the used operating system. After that, the server is automatically started and the player-interface is opened in a local browser window (see the "README.txt" file inside the player-directory).
* To reach the server via the local network, the local IP address of the computer must be determined (e.g. via "ipconfig" on Windows or "ip a" on a Linux system). The address to access the server is "http://YOUR-LOCAL-IP:8489".

## Create your own customized menu
* Clone this repository.
* Put all your content video files inside the content-directory (e.g. episodes of a series, path "player/data/content-site/content").
* Create a JSON file for every content video file inside the content-directory (use the same format as in the sample files).
* Put all your extra-content video files inside the extra-content-directory (e.g. trailers or additional related files, path "player/data/content-site/extra-content").
* Create a JSON file for every extra-content video file (use the same format as in the sample files).
* Modify the "contents.json" file (path "player/data/content-site/contents.json"). Use the same format as in existing file.
* Change the cover file (path "player/data/content-site/cover.jpg"). Supported formats are ".png", ".jpg", ".jpeg", ".webp", ".gif" and ".bmp".
* Change the background-image file (path "player/data/content-site/background-image.jpg"). Supported formats are ".png", ".jpg", ".jpeg", ".webp", ".gif" and ".bmp".
* Add an optional background-video file (example path "player/data/content-site/background-video.mp4"). Supported formats are ".mkv", ".avi", ".mp4", ".webm" and ".mpeg".
* Modify the localization file, if desired (path "player/data/content-site/localization.json").

# Credits
* ⌨️ Code and concept by [zeront4e](https://github.com/zeront4e)
* 🖥 Design and additional code by [Michael-Jk](https://github.com/Michael-Jk)
