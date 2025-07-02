import React, { useState, useEffect } from 'react';
import { useFeedbackMetrics } from '@/hooks/useFeedback';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, MessageSquare, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 2x2 grid positions for cards (relative to grid center)
const gridPositions = [
  { x: -120, y: -120 }, // top-left
  { x: 120, y: -120 },  // top-right
  { x: -120, y: 120 },  // bottom-left
  { x: 120, y: 120 },   // bottom-right
];

const cardVariants = {
  initial: {
    x: 0,
    y: 0,
    opacity: 0,
    scale: 0.8,
    zIndex: 10,
  },
  animate: (i) => ({
    x: gridPositions[i].x,
    y: gridPositions[i].y,
    opacity: 1,
    scale: 1,
    zIndex: 1,
    transition: {
      delay: 0.2 + i * 0.15,
      type: 'spring',
      stiffness: 80,
      damping: 16,
    },
  }),
  final: {
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1,
    zIndex: 1,
    transition: { delay: 0 },
  },
};

const ComprehensiveHome = () => {
  const { data: overallMetrics, isLoading } = useFeedbackMetrics({});
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    // After animation, switch to grid layout
    const timeout = setTimeout(() => setShowGrid(true), 1200);
    return () => clearTimeout(timeout);
  }, []);

  // Card content array for mapping
  const cardContent = [
    {
      key: 'total',
      className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
      icon: <MessageSquare className="w-6 h-6 mr-3" />, title: 'Total Feedback',
      value: isLoading ? 'Loading...' : overallMetrics?.total || 0,
      desc: 'From Database',
      tag: 'Live Data', tagClass: 'bg-green-400/20',
    },
    {
      key: 'avg',
      className: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white',
      icon: <TrendingUp className="w-6 h-6 mr-3" />, title: 'Avg Rating',
      value: isLoading ? 'Loading...' : overallMetrics?.avgRating?.toFixed(2) || '0.00',
      desc: 'Current average (0-5 scale)',
      tag: isLoading ? '...' : `${Math.round((overallMetrics?.positive || 0) / (overallMetrics?.total || 1) * 100)}% positive`, tagClass: 'bg-blue-400/20',
    },
    {
      key: 'resolved',
      className: 'bg-gradient-to-r from-purple-500 to-pink-600 text-white',
      icon: <CheckCircle className="w-6 h-6 mr-3" />, title: 'Resolved Issues',
      value: isLoading ? 'Loading...' : overallMetrics?.resolved || 0,
      desc: isLoading ? 'Loading...' : `${Math.round((overallMetrics?.resolved || 0) / (overallMetrics?.total || 1) * 100)}% resolution rate`,
      tag: 'Active Tracking', tagClass: 'bg-purple-400/20',
    },
    {
      key: 'satisfaction',
      className: 'bg-gradient-to-r from-orange-500 to-red-600 text-white',
      icon: <Users className="w-6 h-6 mr-3" />, title: 'Customer Satisfaction',
      value: isLoading ? 'Loading...' : `${Math.round((overallMetrics?.positive || 0) / (overallMetrics?.total || 1) * 100)}%`,
      desc: isLoading ? 'Loading...' : `${overallMetrics?.positive || 0} positive reviews`,
      tag: 'Real-time Monitoring', tagClass: 'bg-orange-400/20',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-indigo-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent opacity-50 dark:from-blue-900/10 dark:via-transparent dark:to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(45deg,_transparent_25%,_rgba(68,138,255,0.05)_25%,_rgba(68,138,255,0.05)_50%,_transparent_50%,_transparent_75%,_rgba(68,138,255,0.05)_75%)] bg-[length:20px_20px] dark:bg-none" />
      
      {/* Main Content */}
      <div className="relative w-full max-w-7xl mx-auto px-4 py-12 md:py-16 flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-16">
        {/* Left Column: Header and Features */}
        <div className="flex-1 max-w-xl md:pr-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2 dark:from-blue-200 dark:to-indigo-300">
            Mau Bank VoC Analysis System
          </h1>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-6">
            Customer Feedback Intelligence & Resolution Platform - Malaysia
          </p>
          <ul className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 space-y-3 mb-2">
            <li className="flex items-start">
              <TrendingUp className="text-blue-600 dark:text-blue-400 w-7 h-7 mr-3 mt-1" />
              <span className="font-bold">Real-time Analytics</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="text-green-600 dark:text-green-400 w-7 h-7 mr-3 mt-1" />
              <span className="font-bold">Issue Detection & Resolution</span>
            </li>
            <li className="flex items-start">
              <Users className="text-indigo-600 dark:text-indigo-300 w-7 h-7 mr-3 mt-1" />
              <span className="font-bold">Employee Performance Tracking</span>
            </li>
            <li className="flex items-start">
              <AlertTriangle className="text-yellow-500 dark:text-yellow-300 w-7 h-7 mr-3 mt-1" />
              <span className="font-bold">Comprehensive Reporting</span>
            </li>
          </ul>
        </div>

        {/* Right Column: Cards with Overlap-to-Grid Animation */}
        <div className="flex-1 w-full max-w-2xl">
          <div className={showGrid ? 'grid grid-cols-1 md:grid-cols-2 gap-6 relative h-[480px] md:h-[480px]' : 'relative h-[480px] md:h-[480px]'}>
            <AnimatePresence>
              {cardContent.map((card, i) => (
                <motion.div
                  key={card.key}
                  custom={i}
                  initial="initial"
                  animate={showGrid ? 'final' : 'animate'}
                  variants={cardVariants}
                  style={
                    showGrid
                      ? { position: 'static', width: '100%', height: '100%' }
                      : { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%' }
                  }
                  transition={{ type: 'spring', stiffness: 80, damping: 16 }}
                  exit="initial"
                >
                  <Card className={`${card.className} dark:bg-gray-900/80 dark:shadow-2xl dark:border-gray-700 backdrop-blur-sm bg-opacity-90 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center dark:text-gray-100">
                        {card.icon}
                        {card.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold dark:text-white">{card.value}</div>
                      <p className="text-lg mt-1 text-white/80 dark:text-gray-300">{card.desc}</p>
                      <div className="mt-2 text-base">
                        <span className={`${card.tagClass} px-2 py-1 rounded dark:bg-opacity-40`}>{card.tag}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveHome;
