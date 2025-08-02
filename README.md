# Web Synthesizer

A modern, web-based synthesizer built with React, TypeScript, and Web Audio API. This project creates a Moog-inspired synthesizer experience in the browser with a beautiful, authentic interface that draws inspiration from classic Moog synthesizers.

## 🎹 Features

### Core Synthesizer

- **3 Oscillators** with multiple waveforms (sine, sawtooth, triangle, square)
- **Mixer** for blending oscillator outputs
- **Noise Generator** with white and pink noise options
- **Filter Section** with lowpass, highpass, and bandpass filters
- **ADSR Envelope** for dynamic sound shaping
- **LFO (Low Frequency Oscillator)** with multiple routing options

### Effects & Processing

- **Reverb** with adjustable decay and EQ
- **Distortion** with output gain and EQ controls
- **Delay** with time and feedback controls
- **Modulation Wheel** for real-time parameter control

### Interface & Controls

- **Virtual Keyboard** with mouse and keyboard support
- **MIDI Support** for external controller integration
- **Preset System** with classic Moog-inspired sounds
- **Arpeggiator** for rhythmic patterns
- **Power Button** and authentic UI styling

### Technical Features

- **Web Audio API** for high-quality audio processing
- **Real-time parameter updates** with smooth transitions
- **Responsive design** that works on desktop and tablet
- **TypeScript** for type safety and better development experience

## 🚀 Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd model-1
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to see the synthesizer in action.

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🎛️ Usage

### Basic Controls

1. **Power On**: Click the power button to activate the synthesizer
2. **Select Preset**: Choose from the preset dropdown to load classic sounds
3. **Play Notes**: Use your computer keyboard (QWERTY layout) or click the virtual keyboard
4. **Adjust Parameters**: Turn the knobs and sliders to shape your sound

### Keyboard Controls

- **Computer Keyboard**: Use the QWERTY keys to play notes
- **Octave Control**: Use the octave buttons to change pitch range
- **Modulation**: Use the modulation wheel for real-time parameter changes

### MIDI Support

Connect a MIDI controller to your computer and the synthesizer will automatically detect and respond to:

- Note on/off messages
- Pitch bend
- Modulation wheel
- Control change messages

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── ADSR/           # Envelope controls
│   ├── Arpeggiator/    # Arpeggiator interface
│   ├── Effects/        # Reverb, delay, distortion
│   ├── Keyboard/       # Virtual keyboard
│   ├── Knob/           # Reusable knob component
│   ├── Mixer/          # Oscillator mixer
│   ├── Modifiers/      # Filter and LFO controls
│   ├── Noise/          # Noise generator
│   ├── OscillatorBank/ # Oscillator controls
│   ├── PresetSelector/ # Preset management
│   └── Synth/          # Main synthesizer component
├── hooks/              # Custom React hooks
├── store/              # Zustand state management
├── styles/             # CSS modules and global styles
├── synth/              # Audio engine and presets
└── types/              # TypeScript type definitions
```

## 🛠️ Technologies Used

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Zustand** - State management
- **Web Audio API** - Audio processing
- **Tone.js** - Audio framework
- **TunaJS** - Audio effects
- **CSS Modules** - Styled components
- **PostCSS** - CSS processing

## 🎨 Customization

### Adding New Presets

Edit `src/synth/presets.ts` to add new synthesizer presets:

```typescript
"Your Preset Name": {
  octave: 0,
  modMix: 50,
  oscillators: [
    {
      waveform: "sawtooth",
      frequency: 0,
      range: "8",
      volume: 0.8,
      detune: 0,
    },
    // ... more oscillators
  ],
  // ... other parameters
}
```

### Styling

The project uses CSS Modules for component styling. Global styles are in `src/styles/` and component-specific styles are co-located with their components.

## 🐛 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:css` - Run Stylelint

### Code Style

The project uses:

- **ESLint** for JavaScript/TypeScript linting
- **Stylelint** for CSS linting
- **Prettier** for code formatting

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Inspired by classic Moog synthesizer designs and interfaces
- Built with modern web technologies for accessibility and performance
- Special thanks to the Web Audio API community

---

**Note**: This synthesizer is designed for educational and entertainment purposes. For professional audio production, consider using dedicated hardware or software synthesizers.
