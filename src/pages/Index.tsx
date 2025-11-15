import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Flower {
  id: string;
  name: string;
  completedAt: Date;
  duration: number;
  emoji: string;
}

interface Stats {
  totalSessions: number;
  totalMinutes: number;
  flowersCollected: number;
  currentStreak: number;
}

type TimerMode = 'work' | 'break';

const Index = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>('work');
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [plantGrowth, setPlantGrowth] = useState(0);
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    totalMinutes: 0,
    flowersCollected: 0,
    currentStreak: 0,
  });
  const { toast } = useToast();
  const intervalRef = useRef<number | null>(null);

  const flowerEmojis = ['🌸', '🌺', '🌻', '🌷', '🌹', '🏵️', '💐', '🌼'];

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning && mode === 'work') {
        setIsRunning(false);
        setPlantGrowth(0);
        toast({
          title: '💀 Росток погиб!',
          description: 'Ты свернул приложение, и растение завяло',
          variant: 'destructive',
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning, mode, toast]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          
          if (mode === 'work') {
            const totalSeconds = workDuration * 60;
            const progress = ((totalSeconds - newTime) / totalSeconds) * 100;
            setPlantGrowth(progress);
          }
          
          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, mode, workDuration]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    if (mode === 'work') {
      const randomEmoji = flowerEmojis[Math.floor(Math.random() * flowerEmojis.length)];
      const newFlower: Flower = {
        id: Date.now().toString(),
        name: `Цветок #${flowers.length + 1}`,
        completedAt: new Date(),
        duration: workDuration,
        emoji: randomEmoji,
      };
      
      setFlowers([newFlower, ...flowers]);
      setStats(prev => ({
        ...prev,
        totalSessions: prev.totalSessions + 1,
        totalMinutes: prev.totalMinutes + workDuration,
        flowersCollected: prev.flowersCollected + 1,
        currentStreak: prev.currentStreak + 1,
      }));
      
      toast({
        title: `${randomEmoji} Цветок вырос!`,
        description: 'Отличная работа! Добавь его в коллекцию',
      });
      
      setMode('break');
      setTimeLeft(breakDuration * 60);
      setPlantGrowth(0);
    } else {
      toast({
        title: '🌿 Перерыв окончен',
        description: 'Готов к новой сессии?',
      });
      setMode('work');
      setTimeLeft(workDuration * 60);
    }
  };

  const toggleTimer = () => {
    if (!isRunning && mode === 'work') {
      setPlantGrowth(0);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? workDuration * 60 : breakDuration * 60);
    setPlantGrowth(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPlantStage = () => {
    if (plantGrowth < 25) return { emoji: '🌱', scale: 0.6, label: 'Семя' };
    if (plantGrowth < 50) return { emoji: '🌿', scale: 0.8, label: 'Росток' };
    if (plantGrowth < 75) return { emoji: '🌾', scale: 0.9, label: 'Растет' };
    if (plantGrowth < 100) return { emoji: '🪴', scale: 1, label: 'Почти готов' };
    return { emoji: '🌺', scale: 1.2, label: 'Цветок!' };
  };

  const plant = getPlantStage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold bg-gradient-purple bg-clip-text text-transparent mb-2">
            Focus Garden
          </h1>
          <p className="text-muted-foreground">Вырасти свой сад продуктивности</p>
        </div>

        <Tabs defaultValue="timer" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="timer">
              <Icon name="Timer" size={18} className="mr-2" />
              Таймер
            </TabsTrigger>
            <TabsTrigger value="garden">
              <Icon name="Flower2" size={18} className="mr-2" />
              Сад
            </TabsTrigger>
            <TabsTrigger value="stats">
              <Icon name="BarChart3" size={18} className="mr-2" />
              Статистика
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Icon name="Settings" size={18} className="mr-2" />
              Настройки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timer" className="space-y-6">
            <Card className="p-8 backdrop-blur-sm bg-white/80 border-2 shadow-glow-purple">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-purple text-white font-medium">
                  <Icon name={mode === 'work' ? 'BrainCircuit' : 'Coffee'} size={20} />
                  {mode === 'work' ? 'Время работы' : 'Перерыв'}
                </div>

                <div className="relative">
                  <div 
                    className="text-9xl transition-all duration-500 animate-float"
                    style={{ 
                      transform: `scale(${plant.scale})`,
                      filter: isRunning ? 'none' : 'grayscale(50%)'
                    }}
                  >
                    {plant.emoji}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plant.label}</p>
                </div>

                <div className="text-7xl font-bold bg-gradient-blue bg-clip-text text-transparent">
                  {formatTime(timeLeft)}
                </div>

                {mode === 'work' && (
                  <div className="space-y-2">
                    <Progress value={plantGrowth} className="h-3" />
                    <p className="text-sm text-muted-foreground">Рост: {Math.round(plantGrowth)}%</p>
                  </div>
                )}

                <div className="flex gap-4 justify-center">
                  <Button
                    size="lg"
                    onClick={toggleTimer}
                    className="bg-gradient-purple hover:opacity-90 text-white px-8"
                  >
                    <Icon name={isRunning ? 'Pause' : 'Play'} size={20} className="mr-2" />
                    {isRunning ? 'Пауза' : 'Старт'}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={resetTimer}
                    className="px-8"
                  >
                    <Icon name="RotateCcw" size={20} className="mr-2" />
                    Сброс
                  </Button>
                </div>

                {mode === 'work' && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 text-sm">
                    <Icon name="AlertTriangle" size={16} className="inline mr-2 text-yellow-600" />
                    <span className="text-yellow-800">
                      Не сворачивай приложение, иначе росток погибнет!
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="garden" className="space-y-6">
            <Card className="p-6 backdrop-blur-sm bg-white/80 border-2">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Icon name="Flower2" size={24} />
                Коллекция цветов
              </h2>
              
              {flowers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="text-6xl mb-4">🌱</div>
                  <p>Пока нет выращенных цветов</p>
                  <p className="text-sm">Заверши первую сессию!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {flowers.map((flower) => (
                    <Card 
                      key={flower.id} 
                      className="p-4 text-center hover:shadow-glow-purple transition-all hover:scale-105 cursor-pointer"
                    >
                      <div className="text-5xl mb-2 animate-float">{flower.emoji}</div>
                      <p className="font-medium">{flower.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {flower.duration} мин
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(flower.completedAt).toLocaleDateString()}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6 bg-gradient-purple text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Всего сессий</p>
                    <p className="text-3xl font-bold">{stats.totalSessions}</p>
                  </div>
                  <Icon name="Target" size={40} className="opacity-50" />
                </div>
              </Card>

              <Card className="p-6 bg-gradient-blue text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Минут фокуса</p>
                    <p className="text-3xl font-bold">{stats.totalMinutes}</p>
                  </div>
                  <Icon name="Clock" size={40} className="opacity-50" />
                </div>
              </Card>

              <Card className="p-6 bg-gradient-success text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Цветов собрано</p>
                    <p className="text-3xl font-bold">{stats.flowersCollected}</p>
                  </div>
                  <Icon name="Flower" size={40} className="opacity-50" />
                </div>
              </Card>

              <Card className="p-6 bg-gradient-orange text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Текущая серия</p>
                    <p className="text-3xl font-bold">{stats.currentStreak}</p>
                  </div>
                  <Icon name="Flame" size={40} className="opacity-50" />
                </div>
              </Card>
            </div>

            <Card className="p-6 backdrop-blur-sm bg-white/80 border-2">
              <h2 className="text-2xl font-bold mb-4">Прогресс</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Часов сегодня</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.floor(stats.totalMinutes / 60)}ч {stats.totalMinutes % 60}м
                    </span>
                  </div>
                  <Progress value={(stats.totalMinutes / 480) * 100} className="h-2" />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6 backdrop-blur-sm bg-white/80 border-2">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Icon name="Settings" size={24} />
                Настройки Помодоро
              </h2>
              
              <div className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="work-duration">Время работы (минуты)</Label>
                  <Input
                    id="work-duration"
                    type="number"
                    value={workDuration}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 25;
                      setWorkDuration(val);
                      if (mode === 'work' && !isRunning) {
                        setTimeLeft(val * 60);
                      }
                    }}
                    min="1"
                    max="60"
                  />
                  <p className="text-xs text-muted-foreground">
                    Стандартно: 25 минут
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="break-duration">Время перерыва (минуты)</Label>
                  <Input
                    id="break-duration"
                    type="number"
                    value={breakDuration}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 5;
                      setBreakDuration(val);
                      if (mode === 'break' && !isRunning) {
                        setTimeLeft(val * 60);
                      }
                    }}
                    min="1"
                    max="30"
                  />
                  <p className="text-xs text-muted-foreground">
                    Стандартно: 5 минут
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">О методике Помодоро</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Техника Помодоро помогает сохранять фокус через циклы работы и отдыха.
                    Классический цикл: 25 минут работы → 5 минут отдыха.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;