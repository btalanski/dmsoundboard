import audioContext from '../common/audio';

class AudioSourceManager {
  constructor() {
    this.sources = [];
    this.audioCtx = audioContext;
  }

  addSource(source) {
    // Adds new source
    // Connect source to audio context
    this.sources.push(source);
  }

  // removeSource(index) {
  // Removes source from this.sources
  // Disconnect source from audio context
  // }

  getSource(index) {
    // Returns a source by id
    return this.sources[index];
  }
}

export default AudioSourceManager;
