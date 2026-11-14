# VOICE TIMING & AUDIO MASTERING RULES
1. **Source:** Prioritize Sasha's raw voice recordings or ElevenLabs `Sasha_Official` clone.
2. **Audio Mastering:** Apply `highpass=f=70,lowpass=f=12000,acompressor=threshold=-18dB:ratio=3` for warm radio clarity.
3. **Word-Level Sync:** Always run Whisper (`word_timestamps=True`) or ElevenLabs alignment to map subtitles with 0.01s precision.
4. **Ambient Bed:** Subtle background pad at 18–22% volume (`afade` in/out 4s).
