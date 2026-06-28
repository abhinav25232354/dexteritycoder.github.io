# Offline Music Library System

This system is designed for building and maintaining a long term offline music library.

The workflow begins with collecting audio from YouTube playlists. Audio tracks are downloaded in WebM format and then converted to MP3 format for maximum compatibility across devices, operating systems, media players, and car audio systems.

## Workflow

### 1. Playlist Collection

The system accepts a YouTube playlist URL and downloads all available audio tracks from the playlist.

The downloaded files are stored in WebM format.

### 2. Audio Conversion

Downloaded WebM files are converted to high bitrate MP3 files using FFmpeg.

MP3 was chosen because it is supported by virtually all devices and software platforms.

The original WebM files may be retained for archival purposes.

### 3. Audio Enhancement

For playback, FxSound equalization is used to improve the listening experience of compressed audio files.

The equalizer profile is personally tuned and adjusted based on listening preferences.

This step is applied during playback and does not modify the original audio files.

### 4. Metadata Management

MusicBrainz Picard is used to identify tracks and retrieve metadata.

The system uses MusicBrainz databases and acoustic fingerprinting to improve the accuracy of song information.

Metadata may include:

* Title
* Artist
* Album
* Genre
* Release year
* Album artwork
* Track number

### 5. Library Organization

MusicBrainz Picard is also used for album clustering and library organization.

Tracks are grouped into albums and releases whenever possible.

This creates a structured music library that is easier to browse, search, and maintain.

## Purpose

The purpose of this system is to create a permanent personal music collection that is independent of streaming platforms.

An offline library provides:

* Long term access to music
* No subscription requirements
* No advertisements
* No dependency on internet connectivity
* Protection from content removal and regional restrictions
* Greater control over organization and preservation

## Technologies Used

* Python
* FFmpeg
* YouTube playlist download tools
* FxSound
* MusicBrainz Picard

## Future Goals

The collection will continue to grow over time as new music is discovered.

The long term objective is to maintain a well organized offline archive with proper metadata, album information, and reliable backups.