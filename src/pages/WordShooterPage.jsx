import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { wordsService } from '../services/firebaseService';
import { 
  ArrowLeft, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Trophy, 
  Zap, 
  Award, 
  ShieldAlert, 
  Heart,
  Gamepad2
} from 'lucide-react';

// Retro arcade sound effects synthesizer
const playSound = (type, muted) => {
  if (muted || typeof window === 'undefined') return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    if (type === 'shoot') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'correct') {
      // Satisfying ding chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'wrong') {
      // Disappointing buzz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.3);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'explode') {
      // Explosion sound
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (e) {
    console.warn('Web Audio synthesis failed:', e);
  }
};

const cleanChoiceText = (text) => {
  if (!text) return '';
  // Remove content inside parentheses
  let cleaned = text.replace(/\([^)]*\)/g, '').trim();
  cleaned = cleaned.replace(/（[^）]*）/g, '').trim();
  // Split by Persian or English commas
  const parts = cleaned.split(/[،,]+/);
  if (parts.length > 1) {
    let current = parts[0].trim();
    for (let i = 1; i < parts.length; i++) {
      const nextPart = parts[i].trim();
      if (!nextPart) continue;
      const candidate = current + '، ' + nextPart;
      if (candidate.length > 10) break;
      current = candidate;
    }
    return current;
  }
  if (cleaned.length > 12) {
    return cleaned.substring(0, 10).trim() + '...';
  }
  return cleaned;
};

const WordShooterPage = () => {
  const navigate = useNavigate();
  const { updateUserScore, userProfile } = useAuth();
  
  // Game states
  const [gameState, setGameState] = useState('INTRO'); // INTRO, PLAYING, ROUND_RESULT, GAME_OVER, VICTORY
  const [words, setWords] = useState([]);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [shields, setShields] = useState(3);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const [wrongTargetBubble, setWrongTargetBubble] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);
  
  // Canvas refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationFrameId = useRef(null);
  
  // Interactive entities (mutables for high performance drawing loop)
  const shipRef = useRef({ x: 0, y: 0, width: 32, height: 32, speed: 10, targetX: 0 });
  const lasersRef = useRef([]);
  const bubblesRef = useRef([]);
  const particlesRef = useRef([]);
  const starsRef = useRef([]);
  const keysRef = useRef({});
  const flashEffectRef = useRef({ active: false, color: 'rgba(0,0,0,0)', duration: 0 });
  const touchStateRef = useRef({ startX: 0, startY: 0, isDragging: false, active: false });
  
  const currentWord = words[currentWordIdx];
  const maxWords = 15;

  // Auto-hide instructions after 3.5 seconds
  useEffect(() => {
    if (gameState === 'PLAYING' && showInstructions) {
      const timer = setTimeout(() => {
        setShowInstructions(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [gameState, showInstructions]);

  // Initialize words
  useEffect(() => {
    const fetchGameWords = async () => {
      try {
        setLoading(true);
        // Fetch random words for practice
        const data = await wordsService.getRandomWords(30);
        // Slice to max questions
        setWords(data.slice(0, maxWords));
      } catch (err) {
        console.error('Error fetching shooter words:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGameWords();
  }, []);

  // Pre-generate stars background
  useEffect(() => {
    const tempStars = [];
    for (let i = 0; i < 40; i++) {
      tempStars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.8 + 0.2,
        opacity: Math.random() * 0.7 + 0.3
      });
    }
    starsRef.current = tempStars;
  }, []);

  // Setup event listeners for keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.code] = true;
      if (gameState === 'PLAYING') {
        setShowInstructions(false);
      }
      if (e.code === 'Space' && gameState === 'PLAYING') {
        e.preventDefault();
        fireLaser();
      }
    };
    const handleKeyUp = (e) => {
      keysRef.current[e.code] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Start new round (generate bubbles)
  const startRound = (wordIdx) => {
    if (wordIdx >= words.length) {
      handleVictory();
      return;
    }

    const correctWord = words[wordIdx];
    const correctTranslation = cleanChoiceText(correctWord.persianTranslation);

    // Pick 2 distractor translations from other words
    const otherWords = words.filter(w => w.id !== correctWord.id);
    const distractors = [];
    for (const w of otherWords) {
      const cleaned = cleanChoiceText(w.persianTranslation);
      if (cleaned && cleaned !== correctTranslation && !distractors.includes(cleaned)) {
        distractors.push(cleaned);
        if (distractors.length >= 2) break;
      }
    }
    
    // Add default fallback distractors if needed
    while (distractors.length < 2) {
      distractors.push('پاسخ تصادفی ' + (distractors.length + 1));
    }

    const allChoices = [
      { text: correctTranslation, isCorrect: true },
      ...distractors.map(text => ({ text, isCorrect: false }))
    ];

    // Shuffle choices
    const shuffledChoices = [...allChoices];
    for (let i = shuffledChoices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledChoices[i], shuffledChoices[j]] = [shuffledChoices[j], shuffledChoices[i]];
    }

    // Set canvas dimensions
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width;

    // Generate bubbles (3 columns for maximum spacing on mobile)
    const bubbleSpacing = width / 3;
    bubblesRef.current = shuffledChoices.map((choice, i) => ({
      x: bubbleSpacing * i + bubbleSpacing / 2,
      y: -50, // start at same Y to avoid vertical overlaps
      vy: 1.2, // constant faster speed
      radius: 36, // slightly smaller radius for more spacing on mobile
      text: choice.text,
      isCorrect: choice.isCorrect,
      color: `hsl(${140 + i * 40}, 75%, 60%)`, // dynamic colorful look
      opacity: 1
    }));

    // Reset lasers
    lasersRef.current = [];
    
    // Position ship to bottom center
    shipRef.current.x = width / 2;
    shipRef.current.targetX = width / 2;
  };

  const fireLaser = () => {
    const ship = shipRef.current;
    const now = Date.now();
    
    // Rate limit fire: min 150ms between shots
    if (ship.lastFired && now - ship.lastFired < 150) return;
    
    ship.lastFired = now;
    lasersRef.current.push({
      x: ship.x,
      y: ship.y - 15,
      vy: -12,
      radius: 3
    });

    playSound('shoot', muted);
    // Haptic feedback
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  // Trigger explosion particles
  const spawnExplosion = (x, y, color) => {
    const particles = [];
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1.5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1.5,
        color,
        opacity: 1,
        life: 25
      });
    }
    particlesRef.current.push(...particles);
    playSound('explode', muted);
  };

  // Apply flash effect (red/green screen borders)
  const triggerFlash = (color, duration) => {
    flashEffectRef.current = {
      active: true,
      color,
      duration,
      maxDuration: duration
    };
  };

  const handleCorrectChoice = (hitBubble) => {
    spawnExplosion(hitBubble.x, hitBubble.y, '#22c55e');
    triggerFlash('rgba(34, 197, 94, 0.2)', 15);
    playSound('correct', muted);
    setScore(prev => prev + 10);
    
    // Move to next word
    setGameState('ROUND_RESULT');
    setTimeout(() => {
      const nextIdx = currentWordIdx + 1;
      if (nextIdx >= words.length) {
        handleVictory();
      } else {
        setCurrentWordIdx(nextIdx);
        setGameState('PLAYING');
        startRound(nextIdx);
      }
    }, 1200);
  };

  const handleIncorrectChoice = (hitBubble) => {
    spawnExplosion(hitBubble.x, hitBubble.y, '#ef4444');
    triggerFlash('rgba(239, 68, 68, 0.3)', 20);
    playSound('wrong', muted);
    
    // Find correct bubble to highlight
    const correctBubble = bubblesRef.current.find(b => b.isCorrect);
    if (correctBubble) {
      setWrongTargetBubble(correctBubble);
    }
    
    // Deduct shield
    const nextShields = shields - 1;
    setShields(nextShields);

    if (nextShields <= 0) {
      handleGameOver();
    } else {
      setGameState('ROUND_RESULT');
      setTimeout(() => {
        setWrongTargetBubble(null);
        setGameState('PLAYING');
        startRound(currentWordIdx); // retry current word
      }, 1500);
    }
  };

  const handleGameOver = () => {
    setGameState('GAME_OVER');
    // Save points to firestore
    if (score > 0) {
      updateUserScore(score);
    }
  };

  const handleVictory = () => {
    setGameState('VICTORY');
    // Add bonus +50 XP for victory
    const finalScore = score + 50;
    setScore(finalScore);
    updateUserScore(finalScore);
  };

  // Start the game loop
  useEffect(() => {
    if (gameState !== 'PLAYING' && gameState !== 'ROUND_RESULT') {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set proper client size
    const resizeCanvas = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
        shipRef.current.y = rect.height - 45;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Gameplay drawing loop
    const update = () => {
      const width = canvas.width;
      const height = canvas.height;
      const ship = shipRef.current;

      // 1. Clear Canvas
      ctx.fillStyle = '#0a0f1d'; // Space dark
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Stars Background
      starsRef.current.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
        
        // Drifting stars
        star.y += star.speed / 100;
        if (star.y > 1) {
          star.y = 0;
          star.x = Math.random();
        }
      });

      // 3. Move Ship (Keyboard inputs + click slide interpolation)
      if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) {
        ship.x = Math.max(25, ship.x - ship.speed);
        ship.targetX = ship.x;
      }
      if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) {
        ship.x = Math.min(width - 25, ship.x + ship.speed);
        ship.targetX = ship.x;
      }
      
      // Interpolate ship towards click position for smooth slide
      if (Math.abs(ship.x - ship.targetX) > 2) {
        ship.x += (ship.targetX - ship.x) * 0.45;
      }

      // 4. Draw Ship (Glowing sleek triangular arcade ship)
      if (gameState !== 'ROUND_RESULT' || shields > 0) {
        ctx.save();
        ctx.translate(ship.x, ship.y);
        
        // Engine fire flame pulse
        if (gameState === 'PLAYING') {
          const flameScale = Math.random() * 8 + 4;
          ctx.beginPath();
          ctx.moveTo(-5, 12);
          ctx.lineTo(0, 12 + flameScale);
          ctx.lineTo(5, 12);
          ctx.closePath();
          ctx.fillStyle = 'rgba(239, 68, 68, 0.85)'; // Red flame
          ctx.fill();
          
          ctx.beginPath();
          ctx.moveTo(-2, 12);
          ctx.lineTo(0, 12 + flameScale * 0.6);
          ctx.lineTo(2, 12);
          ctx.closePath();
          ctx.fillStyle = 'rgba(245, 158, 11, 0.9)'; // Orange center
          ctx.fill();
        }

        // Draw Ship Body
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(-12, 12);
        ctx.lineTo(12, 12);
        ctx.closePath();
        ctx.fillStyle = '#3390ec'; // Cyan primary ship
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#60a5fa';
        ctx.stroke();

        // Ship Cockpit glow
        ctx.beginPath();
        ctx.arc(0, 2, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        // Draw target English word floating badge directly above the spaceship
        if (currentWord) {
          ctx.save();
          ctx.fillStyle = 'rgba(13, 21, 39, 0.85)';
          ctx.strokeStyle = '#3390ec';
          ctx.lineWidth = 1.5;
          
          const labelText = currentWord.word;
          ctx.font = 'bold 12px sans-serif';
          const textWidth = ctx.measureText(labelText).width;
          const paddingX = 8;
          const labelW = textWidth + paddingX * 2;
          const labelH = 18;
          const labelX = -labelW / 2;
          const labelY = -38; // 20px above the tip of the ship
          
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(labelX, labelY, labelW, labelH, 6);
          } else {
            ctx.rect(labelX, labelY, labelW, labelH);
          }
          ctx.fill();
          ctx.stroke();
          
          // Draw text inside capsule
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, 0, labelY + labelH / 2);
          ctx.restore();
        }

        ctx.restore();
      }

      // 5. Update & Draw Lasers
      if (gameState === 'PLAYING') {
        lasersRef.current.forEach((laser, idx) => {
          laser.y += laser.vy;
          
          // Draw laser glow line
          ctx.beginPath();
          ctx.moveTo(laser.x, laser.y);
          ctx.lineTo(laser.x, laser.y + 12);
          ctx.strokeStyle = '#ef4444'; // Red lasers
          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';
          ctx.stroke();
          
          // Remove laser if offscreen
          if (laser.y < 0) {
            lasersRef.current.splice(idx, 1);
          }
        });
      }

      // 6. Update & Draw Bubbles (Asteroids)
      bubblesRef.current.forEach((bubble, idx) => {
        if (gameState === 'PLAYING') {
          bubble.y += bubble.vy;
        }

        // Check if correct bubble went off bottom of canvas
        if (bubble.y - bubble.radius > height) {
          bubblesRef.current.splice(idx, 1);
          if (bubble.isCorrect && gameState === 'PLAYING') {
            triggerFlash('rgba(239, 68, 68, 0.3)', 20);
            playSound('wrong', muted);
            
            // Deduct shield
            const nextShields = shields - 1;
            setShields(nextShields);

            if (nextShields <= 0) {
              handleGameOver();
            } else {
              setGameState('ROUND_RESULT');
              setTimeout(() => {
                setGameState('PLAYING');
                startRound(currentWordIdx); // retry
              }, 1500);
            }
          }
          return;
        }

        // Draw bubble body
        ctx.save();
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        
        // Glowing overlay
        const isWrongHighlight = wrongTargetBubble && bubble.isCorrect;
        
        ctx.fillStyle = isWrongHighlight ? 'rgba(34, 197, 94, 0.15)' : 'rgba(15, 23, 42, 0.75)';
        ctx.fill();
        
        // Outlines
        ctx.strokeStyle = bubble.isCorrect && isWrongHighlight 
          ? '#22c55e' 
          : bubble.color;
        ctx.lineWidth = bubble.isCorrect && isWrongHighlight ? 3.5 : 2;
        ctx.shadowBlur = bubble.isCorrect && isWrongHighlight ? 12 : 4;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.stroke();
        
        // Draw choice text (with RTL Vazirmatn font and multi-line wrap if contains comma/space)
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const text = bubble.text;
        
        // Check for comma, semicolon, or space separation to wrap onto two lines
        if (text.length > 6 && (text.includes('،') || text.includes(',') || text.includes(' '))) {
          // Split by first Persian or English comma or space
          const splitRegex = /[،,\s]+/;
          const parts = text.split(splitRegex).filter(Boolean);
          if (parts.length >= 2) {
            ctx.font = '500 10.5px Vazirmatn, sans-serif';
            ctx.fillText(parts[0], bubble.x, bubble.y - 7);
            ctx.fillText(parts.slice(1).join(' '), bubble.x, bubble.y + 7);
          } else {
            ctx.font = '500 11.5px Vazirmatn, sans-serif';
            ctx.fillText(text, bubble.x, bubble.y);
          }
        } else {
          // Single-line text with adaptive size
          if (text.length > 8) {
            ctx.font = '500 10.5px Vazirmatn, sans-serif';
          } else {
            ctx.font = '500 13px Vazirmatn, sans-serif';
          }
          ctx.fillText(text, bubble.x, bubble.y);
        }
        ctx.restore();

        // 7. Check Collisions (lasers vs bubble)
        if (gameState === 'PLAYING') {
          lasersRef.current.forEach((laser, lIdx) => {
            const dist = Math.hypot(laser.x - bubble.x, laser.y - bubble.y);
            if (dist < bubble.radius + laser.radius) {
              // Destroy laser
              lasersRef.current.splice(lIdx, 1);
              
              // Handle choice correctness
              if (bubble.isCorrect) {
                handleCorrectChoice(bubble);
              } else {
                handleIncorrectChoice(bubble);
              }
            }
          });
        }
      });

      // 8. Update & Draw Particles (Explosions)
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity = Math.max(0, p.opacity - 0.04);
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1; // restore
        
        if (p.opacity <= 0) {
          particlesRef.current.splice(idx, 1);
        }
      });

      // 9. Draw Screen borders flash effects
      const flash = flashEffectRef.current;
      if (flash.active) {
        ctx.fillStyle = flash.color;
        ctx.fillRect(0, 0, width, height);
        
        flash.duration--;
        if (flash.duration <= 0) {
          flash.active = false;
        }
      }

      // Next loop
      animationFrameId.current = requestAnimationFrame(update);
    };

    // Trigger loop
    animationFrameId.current = requestAnimationFrame(update);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [gameState, words, currentWordIdx, shields, muted, wrongTargetBubble]);

  // Handle touch/mouse interactions: separating tap-to-shoot from drag-to-slide
  const handleInteractionStart = (e) => {
    if (gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const xOnCanvas = clientX - rect.left;
    
    touchStateRef.current = {
      startX: clientX,
      startY: clientY,
      isDragging: false,
      active: true
    };
    
    // Instantly target ship position
    shipRef.current.targetX = Math.max(25, Math.min(canvas.width - 25, xOnCanvas));
  };

  const handleInteractionMove = (e) => {
    const state = touchStateRef.current;
    if (!state.active || gameState !== 'PLAYING') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const xOnCanvas = clientX - rect.left;
    
    // Set dragging to true if moved past threshold
    const dist = Math.hypot(clientX - state.startX, clientY - state.startY);
    if (dist > 8) {
      state.isDragging = true;
    }
    
    // Slide ship to target X position
    shipRef.current.targetX = Math.max(25, Math.min(canvas.width - 25, xOnCanvas));
  };

  const handleInteractionEnd = () => {
    const state = touchStateRef.current;
    if (!state.active) return;
    state.active = false;
    
    if (gameState !== 'PLAYING') return;
    
    // Shoot ONLY if they tapped (did not slide/drag)
    if (!state.isDragging) {
      if (showInstructions) {
        setShowInstructions(false);
      }
      fireLaser();
    }
  };

  const handleStartGame = () => {
    if (words.length === 0) return;
    setScore(0);
    setShields(3);
    setCurrentWordIdx(0);
    setGameState('PLAYING');
    setShowInstructions(true);
    setTimeout(() => startRound(0), 100);
  };

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[#0a0f1d] select-none text-white z-50">
      {/* Top Header Panel */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0d1527] border-b border-[#1b253b] z-20">
        <button
          onClick={() => navigate('/learn')}
          className="flex items-center text-sm font-semibold text-[#3390ec] hover:opacity-85"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>Exit</span>
        </button>
        
        <div className="flex items-center gap-1 bg-[#1e293b] px-3 py-1 rounded-full border border-[#2e3b4e]">
          <Gamepad2 className="w-3.5 h-3.5 text-[#3390ec]" />
          <span className="text-xs font-bold text-gray-200">SPACE SHIFT</span>
        </div>

        <button
          onClick={() => setMuted(!muted)}
          className="text-gray-400 hover:text-white"
        >
          {muted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-[#22c55e]" />}
        </button>
      </div>

      {/* Target Word Info Panel (Rendered as overlay on top of canvas) */}
      {(gameState === 'PLAYING' || gameState === 'ROUND_RESULT') && currentWord && (
        <div className="px-4 py-3 bg-[#0d1527] border-b border-[#1b253b] flex items-center justify-between z-20">
          <div className="flex-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Target English Word</span>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#3390ec] tracking-wide">{currentWord.word}</h2>
              <span className="text-xs text-gray-400 font-medium">({currentWord.spell})</span>
            </div>
          </div>
          
          {/* Shields (Lives) */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Shield HP</span>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <Heart 
                  key={i} 
                  className={`w-4.5 h-4.5 ${i < shields ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas Playing Area */}
      <div 
        ref={containerRef} 
        className="flex-1 relative cursor-crosshair overflow-hidden"
        onMouseDown={handleInteractionStart}
        onMouseMove={handleInteractionMove}
        onMouseUp={handleInteractionEnd}
        onMouseLeave={handleInteractionEnd}
        onTouchStart={handleInteractionStart}
        onTouchMove={handleInteractionMove}
        onTouchEnd={handleInteractionEnd}
      >
        <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
        
        {/* Helper overlay instruction indicator */}
        {gameState === 'PLAYING' && showInstructions && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none text-center bg-black bg-opacity-65 px-4 py-2 rounded-2xl border border-gray-800 text-[11px] text-gray-300 tracking-wide font-medium z-30 animate-pulse">
            Tap anywhere to slide & shoot asteroid
          </div>
        )}

        {/* Highlight target translation when user makes an error */}
        {gameState === 'ROUND_RESULT' && wrongTargetBubble && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-950 bg-opacity-95 border border-red-500 p-4 rounded-2xl shadow-2xl text-center w-72 z-30 animate-pulse">
            <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-red-400 mb-1">SHIELD CRITICAL</h3>
            <p className="text-xs text-gray-300 mb-2">Wrong target blasted!</p>
            <div className="bg-green-900 bg-opacity-40 border border-green-800 p-2.5 rounded-xl">
              <span className="text-[10px] text-green-400 font-bold block uppercase tracking-wide">Correct Translation</span>
              <span className="text-lg font-bold font-persian text-white">{currentWord?.persianTranslation}</span>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="absolute inset-0 bg-[#0a0f1d] flex flex-col items-center justify-center space-y-4 z-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3390ec]"></div>
            <p className="text-sm text-gray-400">Arming lasers and fetching words...</p>
          </div>
        )}

        {/* INTRO INSTRUCTIONS SCREEN */}
        {!loading && gameState === 'INTRO' && (
          <div className="absolute inset-0 bg-[#0a0f1d] bg-opacity-95 flex items-center justify-center p-6 z-30">
            <div className="max-w-md w-full bg-[#0d1527] border border-[#1b253b] p-6 rounded-2xl text-center space-y-6 shadow-2xl">
              <div className="mx-auto h-16 w-16 bg-blue-950 border border-blue-800 rounded-full flex items-center justify-center text-[#3390ec] animate-bounce">
                <Gamepad2 className="w-8 h-8" />
              </div>
              
              <div>
                <h2 className="text-2xl font-black text-white tracking-wide">Space Blaster Game</h2>
                <p className="text-xs text-gray-400 mt-1">Practice translations in a 2D space shooter!</p>
              </div>

              <div className="bg-[#131d33] border border-[#1e2c4a] p-4 rounded-xl text-left space-y-3">
                <h4 className="text-xs font-bold text-[#3390ec] uppercase tracking-wide">How To Play:</h4>
                <ul className="text-xs text-gray-300 space-y-2 list-disc list-inside">
                  <li>A target English word is shown at the top.</li>
                  <li>Asteroids with Persian choices float down.</li>
                  <li><strong>Aim & Shoot</strong>: Click or Tap the correct asteroid to blast it!</li>
                  <li>If using a desktop, use <kbd className="bg-slate-700 px-1 py-0.5 rounded text-[10px]">Arrow Keys</kbd> to steer and <kbd className="bg-slate-700 px-1 py-0.5 rounded text-[10px]">Space</kbd> to fire.</li>
                  <li>Blasting incorrect asteroids or letting correct ones drop will deplete your shields!</li>
                </ul>
              </div>

              <button
                onClick={handleStartGame}
                className="btn btn-primary w-full py-3.5 text-sm font-extrabold uppercase tracking-wide rounded-xl"
              >
                Launch Spaceship 🚀
              </button>
            </div>
          </div>
        )}

        {/* GAME OVER SCREEN */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-[#0a0f1d] bg-opacity-95 flex items-center justify-center p-6 z-30">
            <div className="max-w-md w-full bg-[#0d1527] border border-[#ef4444] border-opacity-30 p-6 rounded-2xl text-center space-y-6 shadow-2xl">
              <div className="mx-auto h-14 w-14 bg-red-950 border border-red-800 rounded-full flex items-center justify-center text-red-500">
                <ShieldAlert className="w-8 h-8" />
              </div>
              
              <div>
                <h2 className="text-2xl font-black text-white tracking-wide">Ship Destroyed</h2>
                <p className="text-xs text-gray-400 mt-1">Your shield hit 0% critical damage!</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-[#131d33] p-4 rounded-xl">
                <div className="text-center border-r border-[#1e2c4a]">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wide">Score</span>
                  <span className="text-2xl font-black text-[#3390ec]">{score}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wide">XP Earned</span>
                  <span className="text-2xl font-black text-[#22c55e]">+{score}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleStartGame}
                  className="btn btn-primary w-full py-3 text-sm font-extrabold uppercase tracking-wide rounded-xl flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry Battle</span>
                </button>
                <button
                  onClick={() => navigate('/learn')}
                  className="btn btn-outline w-full py-3 text-sm font-bold rounded-xl"
                >
                  Back to Learn
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VICTORY SCREEN */}
        {gameState === 'VICTORY' && (
          <div className="absolute inset-0 bg-[#0a0f1d] bg-opacity-95 flex items-center justify-center p-6 z-30">
            <div className="max-w-md w-full bg-[#0d1527] border border-green-500 border-opacity-30 p-6 rounded-2xl text-center space-y-6 shadow-2xl animate-fade-in">
              <div className="mx-auto h-16 w-16 bg-green-950 border border-green-800 rounded-full flex items-center justify-center text-green-500 animate-bounce">
                <Award className="w-9 h-9" />
              </div>
              
              <div>
                <h2 className="text-2xl font-black text-white tracking-wide">Universe Saved!</h2>
                <p className="text-xs text-gray-400 mt-1">You blasted all 15 translation asteroids correctly!</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-[#131d33] p-4 rounded-xl border border-[#1e2c4a]">
                <div className="text-center border-r border-[#1e2c4a]">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wide">Score</span>
                  <span className="text-2xl font-black text-[#3390ec]">{score}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wide">XP + Bonus</span>
                  <span className="text-2xl font-black text-green-400">+{score}</span>
                </div>
              </div>

              <div className="bg-[#131d33] border border-green-900 border-opacity-30 p-3.5 rounded-xl text-center">
                <span className="text-xs text-green-400 font-semibold block">🏆 Victory Bonus +50 XP Awarded</span>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleStartGame}
                  className="btn btn-primary w-full py-3 text-sm font-extrabold uppercase tracking-wide rounded-xl flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again</span>
                </button>
                <button
                  onClick={() => navigate('/learn')}
                  className="btn btn-outline w-full py-3 text-sm font-bold rounded-xl"
                >
                  Back to Learn
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Footer bar */}
      {(gameState === 'PLAYING' || gameState === 'ROUND_RESULT') && (
        <div className="px-4 py-3 bg-[#0d1527] border-t border-[#1b253b] flex items-center justify-between text-xs text-gray-400 font-bold z-20">
          <span>WORD {currentWordIdx + 1} OF {maxWords}</span>
          <span className="text-[#3390ec]">SCORE: {score} PTS</span>
        </div>
      )}
    </div>
  );
};

export default WordShooterPage;
