import AppKit
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

struct IconTarget {
  let path: String
  let size: Int
}

let root = FileManager.default.currentDirectoryPath
let targets = [
  IconTarget(path: "docs/app/assets/apple-touch-icon.png", size: 180),
  IconTarget(path: "docs/app/assets/apple-touch-icon-v2.png", size: 180),
  IconTarget(path: "docs/app/assets/icon-192.png", size: 192),
  IconTarget(path: "docs/app/assets/icon-512.png", size: 512),
  IconTarget(path: "docs/app/assets/icon-maskable-512.png", size: 512),
  IconTarget(path: "works/diet-tracker-pro/assets/apple-touch-icon.png", size: 180),
  IconTarget(path: "works/diet-tracker-pro/assets/apple-touch-icon-v2.png", size: 180),
  IconTarget(path: "works/diet-tracker-pro/assets/icon-192.png", size: 192),
  IconTarget(path: "works/diet-tracker-pro/assets/icon-512.png", size: 512),
  IconTarget(path: "works/diet-tracker-pro/assets/icon-maskable-512.png", size: 512)
]

func color(_ hex: UInt32, _ alpha: CGFloat = 1) -> CGColor {
  CGColor(
    red: CGFloat((hex >> 16) & 0xff) / 255,
    green: CGFloat((hex >> 8) & 0xff) / 255,
    blue: CGFloat(hex & 0xff) / 255,
    alpha: alpha
  )
}

func nsColor(_ hex: UInt32, _ alpha: CGFloat = 1) -> NSColor {
  NSColor(
    red: CGFloat((hex >> 16) & 0xff) / 255,
    green: CGFloat((hex >> 8) & 0xff) / 255,
    blue: CGFloat(hex & 0xff) / 255,
    alpha: alpha
  )
}

func drawLinearGradient(_ context: CGContext, colors: [CGColor], start: CGPoint, end: CGPoint) {
  let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors as CFArray, locations: nil)!
  context.drawLinearGradient(gradient, start: start, end: end, options: [])
}

func rounded(_ context: CGContext, _ rect: CGRect, _ radius: CGFloat) {
  context.addPath(CGPath(roundedRect: rect, cornerWidth: radius, cornerHeight: radius, transform: nil))
}

func fillRoundedGradient(_ context: CGContext, rect: CGRect, radius: CGFloat, colors: [CGColor], start: CGPoint, end: CGPoint) {
  context.saveGState()
  context.beginPath()
  rounded(context, rect, radius)
  context.clip()
  drawLinearGradient(context, colors: colors, start: start, end: end)
  context.restoreGState()
}

func strokeRounded(_ context: CGContext, rect: CGRect, radius: CGFloat, color: CGColor, width: CGFloat) {
  context.saveGState()
  context.beginPath()
  rounded(context, rect, radius)
  context.setStrokeColor(color)
  context.setLineWidth(width)
  context.strokePath()
  context.restoreGState()
}

func arc(_ context: CGContext, center: CGPoint, radius: CGFloat, width: CGFloat, start: CGFloat, end: CGFloat, color: CGColor) {
  context.saveGState()
  context.setStrokeColor(color)
  context.setLineWidth(width)
  context.setLineCap(.round)
  context.addArc(center: center, radius: radius, startAngle: start, endAngle: end, clockwise: false)
  context.strokePath()
  context.restoreGState()
}

func drawIcon(size: Int) -> CGImage {
  let scale = CGFloat(size) / 1024
  let context = CGContext(
    data: nil,
    width: size,
    height: size,
    bitsPerComponent: 8,
    bytesPerRow: size * 4,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
  )!

  context.scaleBy(x: scale, y: scale)
  let canvas = CGRect(x: 0, y: 0, width: 1024, height: 1024)

  context.beginPath()
  rounded(context, canvas.insetBy(dx: 10, dy: 10), 230)
  context.clip()
  drawLinearGradient(context, colors: [color(0x050608), color(0x151a1f), color(0x08090c)], start: CGPoint(x: 70, y: 70), end: CGPoint(x: 950, y: 980))

  context.saveGState()
  context.setBlendMode(.screen)
  let aquaGlow = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: [color(0x9defff, 0.38), color(0x9defff, 0)] as CFArray, locations: [0, 1])!
  context.drawRadialGradient(aquaGlow, startCenter: CGPoint(x: 298, y: 724), startRadius: 2, endCenter: CGPoint(x: 298, y: 724), endRadius: 390, options: [])
  let goldGlow = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: [color(0xf0d39b, 0.28), color(0xf0d39b, 0)] as CFArray, locations: [0, 1])!
  context.drawRadialGradient(goldGlow, startCenter: CGPoint(x: 740, y: 260), startRadius: 4, endCenter: CGPoint(x: 740, y: 260), endRadius: 420, options: [])
  context.restoreGState()

  strokeRounded(context, rect: canvas.insetBy(dx: 52, dy: 52), radius: 188, color: color(0xffffff, 0.14), width: 8)

  let center = CGPoint(x: 512, y: 512)
  arc(context, center: center, radius: 286, width: 82, start: -2.82, end: -1.22, color: color(0x9defff))
  arc(context, center: center, radius: 286, width: 82, start: -1.05, end: 0.56, color: color(0xf6f9ff))
  arc(context, center: center, radius: 286, width: 82, start: 0.72, end: 2.08, color: color(0xf0d39b))
  arc(context, center: center, radius: 286, width: 82, start: 2.24, end: 3.68, color: color(0xaeb8ff))
  arc(context, center: center, radius: 288, width: 12, start: -3.1, end: 3.1, color: color(0xffffff, 0.5))
  arc(context, center: center, radius: 216, width: 9, start: -3.1, end: 3.1, color: color(0x050608, 0.86))

  let panel = CGRect(x: 344, y: 310, width: 336, height: 404)
  fillRoundedGradient(context, rect: panel, radius: 124, colors: [color(0x11161b, 0.98), color(0x050608, 0.98)], start: CGPoint(x: 344, y: 310), end: CGPoint(x: 680, y: 714))
  strokeRounded(context, rect: panel, radius: 124, color: color(0xffffff, 0.18), width: 5)

  fillRoundedGradient(context, rect: CGRect(x: 410, y: 374, width: 204, height: 58), radius: 29, colors: [color(0xf8fbff), color(0xb8c2cc)], start: CGPoint(x: 410, y: 374), end: CGPoint(x: 614, y: 432))
  fillRoundedGradient(context, rect: CGRect(x: 410, y: 492, width: 204, height: 58), radius: 29, colors: [color(0x9defff), color(0xaeb8ff)], start: CGPoint(x: 410, y: 492), end: CGPoint(x: 614, y: 550))
  fillRoundedGradient(context, rect: CGRect(x: 410, y: 610, width: 148, height: 58), radius: 29, colors: [color(0xf0d39b), color(0x9defff)], start: CGPoint(x: 410, y: 610), end: CGPoint(x: 558, y: 668))

  context.setFillColor(color(0x9defff))
  context.addEllipse(in: CGRect(x: 636, y: 588, width: 96, height: 96))
  context.fillPath()
  context.setStrokeColor(color(0xffffff, 0.62))
  context.setLineWidth(5)
  context.addEllipse(in: CGRect(x: 636, y: 588, width: 96, height: 96))
  context.strokePath()

  strokeRounded(context, rect: canvas.insetBy(dx: 18, dy: 18), radius: 220, color: color(0xffffff, 0.09), width: 18)

  return context.makeImage()!
}

func writePNG(_ image: CGImage, to path: String) {
  let url = URL(fileURLWithPath: root).appendingPathComponent(path)
  let destination = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(destination, image, nil)
  CGImageDestinationFinalize(destination)
}

for target in targets {
  writePNG(drawIcon(size: target.size), to: target.path)
}
