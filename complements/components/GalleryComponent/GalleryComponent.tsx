// components/GalleryGrid.tsx
"use client";

import Image from "next/image";
import styles from "./GalleryComponent.module.css";

type GalleryGridProps = {
  images: string[];
  onImageClick?: (index: number) => void; // Nuevo prop
};

const GalleryGrid: React.FC<GalleryGridProps> = ({ images, onImageClick }) => {
  return (
    <div className={styles.masonry}>
      {images.map((src, index) => (
        <div
          key={index}
          className={styles.item}
          onClick={() => onImageClick && onImageClick(index)} // Solo si hay función
          role="button"
        >
          <Image
            src={src}
            alt={`Gallery image ${index + 1}`}
            width={500}
            height={500}
            className={styles.image}
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
};

export default GalleryGrid;