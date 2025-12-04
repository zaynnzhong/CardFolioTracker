import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export type FocusCard = {
  title: string;
  src: string;
};

export const FocusCards = ({ cards }: { cards: FocusCard[] }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 max-w-7xl mx-auto w-full">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          card={card}
          index={index}
          hovered={hovered}
          setHovered={setHovered}
        />
      ))}
    </div>
  );
};

const Card = ({
  card,
  index,
  hovered,
  setHovered,
}: {
  card: FocusCard;
  index: number;
  hovered: number | null;
  setHovered: React.Dispatch<React.SetStateAction<number | null>>;
}) => {
  return (
    <motion.div
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "w-full transition-all duration-300 ease-out cursor-pointer",
        hovered !== null && hovered !== index && "blur-sm scale-[0.98] opacity-60"
      )}
    >
      <motion.div
        className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/50 hover:border-crypto-lime/30 transition-colors"
        initial={{ scale: 1 }}
        animate={{
          scale: hovered === index ? 1.02 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative w-full aspect-[2.5/3.5] overflow-hidden">
          <motion.img
            src={card.src}
            alt={card.title}
            className="w-full h-full object-cover"
            initial={{ scale: 1 }}
            animate={{
              scale: hovered === index ? 1.05 : 1,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="p-4 bg-slate-900/95 backdrop-blur-sm">
          <h3 className="text-white font-semibold text-sm line-clamp-2">
            {card.title}
          </h3>
        </div>
      </motion.div>
    </motion.div>
  );
};
