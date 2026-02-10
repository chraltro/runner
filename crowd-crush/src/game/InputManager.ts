export class InputManager {
  private canvas: HTMLCanvasElement;
  private isDragging = false;
  private lastX = 0;
  private currentX = 0;
  private dragDeltaX = 0;
  onTap: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.bindEvents();
  }

  private bindEvents() {
    // Touch events
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', this.onTouchEnd, { passive: false });

    // Mouse events (for desktop testing)
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('mouseleave', this.onMouseUp);

    // Prevent context menu
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Prevent default touch behaviors on document
    document.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });
  }

  private onTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    this.isDragging = true;
    this.lastX = touch.clientX;
    this.currentX = touch.clientX;
    this.dragDeltaX = 0;
  };

  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!this.isDragging) return;
    const touch = e.touches[0];
    this.currentX = touch.clientX;
    this.dragDeltaX = this.currentX - this.lastX;
    this.lastX = this.currentX;
  };

  private onTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    if (this.isDragging && Math.abs(this.dragDeltaX) < 5) {
      this.onTap?.();
    }
    this.isDragging = false;
    this.dragDeltaX = 0;
  };

  private onMouseDown = (e: MouseEvent) => {
    this.isDragging = true;
    this.lastX = e.clientX;
    this.currentX = e.clientX;
    this.dragDeltaX = 0;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) return;
    this.currentX = e.clientX;
    this.dragDeltaX = this.currentX - this.lastX;
    this.lastX = this.currentX;
  };

  private onMouseUp = () => {
    if (this.isDragging && Math.abs(this.dragDeltaX) < 5) {
      this.onTap?.();
    }
    this.isDragging = false;
    this.dragDeltaX = 0;
  };

  getDragDelta(): number {
    const delta = this.dragDeltaX;
    this.dragDeltaX = 0;
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
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('mouseleave', this.onMouseUp);
  }
}
