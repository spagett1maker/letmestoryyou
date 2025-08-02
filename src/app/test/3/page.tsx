'use client'

import { useEffect, useRef } from 'react'

interface Vector {
  x: number
  y: number
}

class VectorClass implements Vector {
  x: number
  y: number

  constructor(x: number = 0, y: number = 0) {
    this.x = x
    this.y = y
  }

  add(v: Vector): VectorClass {
    this.x += v.x
    this.y += v.y
    return this
  }

  multiply(value: number): VectorClass {
    this.x *= value
    this.y *= value
    return this
  }

  getMagnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }
}

class Fragment {
  position: VectorClass
  velocity: VectorClass
  startSpeed: number
  radius: number
  hue: number

  constructor(position: VectorClass, velocity: VectorClass, radius: number, hue: number) {
    this.position = position
    this.velocity = velocity
    this.startSpeed = this.velocity.getMagnitude()
    this.radius = radius
    this.hue = hue
  }

  update(world: World): void {
    this.velocity.multiply(world.physicalProperties.friction)
    this.position.add(this.velocity)
    this.radius *= this.velocity.getMagnitude() / this.startSpeed
    if (this.radius < 0.1) {
      const index = world.objects.indexOf(this)
      if (index > -1) {
        world.objects.splice(index, 1)
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath()
    ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
    ctx.fill()
  }
}

class Bubble {
  x: number
  y: number
  startX: number
  speed: number
  radius: number
  fragments: number
  swing: number
  hue: number

  constructor(x: number, y: number, speed: number, radius: number, fragments: number, swing: number, hue: number) {
    this.x = x
    this.y = y
    this.startX = this.x
    this.speed = speed
    this.radius = radius
    this.fragments = fragments
    this.swing = swing
    this.hue = hue
  }

  update(world: World): void {
    this.x = this.startX + Math.cos(this.y / 80) * this.swing
    this.y += this.speed
    if (this.y + this.radius < 0) {
      this.y = world.physicalProperties.height + this.radius
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath()
    ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI)
    ctx.fill()
  }

  pop(world: World): void {
    const index = world.objects.indexOf(this)
    if (index > -1) {
      world.objects.splice(index, 1)
    }
    for (let i = 0; i < this.fragments; i++) {
      world.objects.push(
        new Fragment(
          new VectorClass(this.x, this.y),
          new VectorClass(randomInRange(-2, 2), randomInRange(-2, 2)),
          randomInRange(2, this.radius / 4),
          this.hue
        )
      )
    }
  }
}

interface PhysicalProperties {
  width: number
  height: number
  friction: number
}

class World {
  physicalProperties: PhysicalProperties
  objects: (Bubble | Fragment)[]
  ctx: CanvasRenderingContext2D
  background: string
  frameID: number

  constructor(physicalProperties: PhysicalProperties, objects: (Bubble | Fragment)[], ctx: CanvasRenderingContext2D, background: string) {
    this.physicalProperties = physicalProperties
    this.objects = objects
    this.ctx = ctx
    this.background = background
    this.frameID = 0
  }

  update(): void {
    for (let i = 0; i < this.objects.length; i++) {
      this.objects[i].update(this)
    }
  }

  render(): void {
    this.ctx.clearRect(0, 0, this.physicalProperties.width, this.physicalProperties.height)
    if (this.background) {
      this.ctx.fillStyle = this.background
      this.ctx.fillRect(0, 0, this.physicalProperties.width, this.physicalProperties.height)
    }
    for (let i = 0; i < this.objects.length; i++) {
      this.objects[i].render(this.ctx)
    }
  }

  animate(): void {
    this.update()
    this.render()
    this.frameID = requestAnimationFrame(() => this.animate())
  }

  stopAnimation(): void {
    if (this.frameID) {
      cancelAnimationFrame(this.frameID)
    }
  }
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export default function BubbleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const worldRef = useRef<World | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width = window.innerWidth
    const h = canvas.height = window.innerHeight

    const bubblesNumber = w * h > 750000 ? 200 : 150
    const objects: (Bubble | Fragment)[] = []
    const maxRadius = w * h > 500000 ? 50 : 35
    const maxYVelocity = 2

    // Create bubbles
    for (let i = 0; i < bubblesNumber; i++) {
      objects.push(
        new Bubble(
          Math.random() * w,
          Math.random() * h,
          -randomInRange(0.5, maxYVelocity),
          randomInRange(5, maxRadius),
          randomInRange(7, 10),
          randomInRange(-40, 40),
          randomInRange(0, 360)
        )
      )
    }

    const world = new World(
      {
        width: canvas.width,
        height: canvas.height,
        friction: 0.997
      },
      objects,
      ctx,
      'rgb(0, 50, 255)'
    )

    worldRef.current = world
    ctx.globalCompositeOperation = 'lighter'
    world.animate()

    // Handle resize
    const handleResize = () => {
      const newW = canvas.width = window.innerWidth
      const newH = canvas.height = window.innerHeight
      world.physicalProperties.width = newW
      world.physicalProperties.height = newH
      ctx.globalCompositeOperation = 'lighter'
    }

    // Handle mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      for (let i = 0; i < world.objects.length; i++) {
        const obj = world.objects[i]
        if (obj instanceof Bubble) {
          if (
            e.clientX > obj.x - obj.radius &&
            e.clientX < obj.x + obj.radius &&
            e.clientY < obj.y + obj.radius &&
            e.clientY > obj.y - obj.radius
          ) {
            obj.pop(world)
          }
        }
      }
    }

    // Handle touch interaction
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      for (let i = 0; i < world.objects.length; i++) {
        const obj = world.objects[i]
        if (obj instanceof Bubble) {
          const touch = e.touches[0]
          if (
            touch.clientX > obj.x - obj.radius &&
            touch.clientX < obj.x + obj.radius &&
            touch.clientY < obj.y + obj.radius &&
            touch.clientY > obj.y - obj.radius
          ) {
            obj.pop(world)
          }
        }
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      world.stopAnimation()
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  return (
    <div className="relative m-0">
      <canvas
        ref={canvasRef}
        className="absolute cursor-crosshair"
        style={{ position: 'absolute' }}
      />
    </div>
  )
}