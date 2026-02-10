export class InputManager {
  private canvas: HTMLCanvasElement;
  private isDragging = false;
  private lastX = 0;
  private accumulatedDeltaX = 0;
  private startX = 0;
  private startY = 0;
  private tapThreshold = 10;
  onTap: (() => void) | null = null;
  private preventContextMenu = (e: Event) => e.preventDefault();
  private preventDocTouch = (e: Event) => { e.preventDefault(); };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.bindEvents();
  }

  private bindEvents() {
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', this.onTouchEnd, { passive: false });

    this.canvas.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);

    this.canvas.addEventListener('contextmenu', this.preventContextMenu);
    document.addEventListener('touchmove', this.preventDocTouch, { passive: false });
  }

  private onTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    this.isDragging = true;
    this.lastX = touch.clientX;
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.accumulatedDeltaX = 0;
  };

  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!this.isDragging) return;
    const touch = e.touches[0];
    const delta = touch.clientX - this.lastX;
    this.accumulatedDeltaX += delta;
    this.lastX = touch.clientX;
  };

  private onTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    if (this.isDragging) {
      const dx = Math.abs(this.lastX - this.startX);
      if (dx < this.tapThreshold) {
        this.onTap?.();
      }
    }
    this.isDragging = false;
  };

  private onMouseDown = (e: MouseEvent) => {
    this.isDragging = true;
    this.lastX = e.clientX;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.accumulatedDeltaX = 0;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) return;
    const delta = e.clientX - this.lastX;
    this.accumulatedDeltaX += delta;
    this.lastX = e.clientX;
  };

  private onMouseUp = () => {
    if (this.isDragging) {
      const dx = Math.abs(this.lastX - this.startX);
      if (dx < this.tapThreshold) {
        this.onTap?.();
      }
    }
    this.isDragging = false;
  };

  consumeDragDelta(): number {
    const delta = this.accumulatedDeltaX;
    this.accumulatedDeltaX = 0;
    return delta;
  }

  getIsDragging(): boolean {
    return this.isDragging;
  }

  destroy() {
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.onTouchEnd);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('contextmenu', this.preventContextMenu);
    document.removeEventListener('touchmove', this.preventDocTouch);
  }
}
