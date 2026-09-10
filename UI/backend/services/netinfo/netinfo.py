"""The URL students open, and its QR code. Under WSL the Windows LAN address is what phones can reach."""
import socket
import subprocess

import qrcode
import qrcode.image.svg

_WIN_LAN_IP = (
    "(Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' }"
    " | Select-Object -First 1).IPv4Address.IPAddress"
)


def is_wsl() -> bool:
    try:
        return "microsoft" in open("/proc/version").read().lower()
    except OSError:
        return False


def _windows_lan_ip() -> str | None:
    try:
        out = subprocess.run(
            ["powershell.exe", "-NoProfile", "-Command", _WIN_LAN_IP],
            capture_output=True, text=True, timeout=8,
        ).stdout.strip()
        return out.splitlines()[0].strip() if out else None
    except (OSError, subprocess.TimeoutExpired):
        return None


def _socket_ip() -> str:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def lan_ip() -> str:
    if is_wsl():
        ip = _windows_lan_ip()
        if ip:
            return ip
    return _socket_ip()


def public_url(port: int, override: str | None) -> str:
    base = override.rstrip("/") if override else f"http://{lan_ip()}:{port}"
    return f"{base}/submit"


def qr_svg(url: str) -> str:
    img = qrcode.make(url, image_factory=qrcode.image.svg.SvgPathFillImage, box_size=10, border=2)
    return img.to_string(encoding="unicode")
