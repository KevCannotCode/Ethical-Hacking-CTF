from backend.services.netinfo import netinfo


def test_public_url_override_points_at_submit_page():
    assert netinfo.public_url(8000, "http://10.0.0.5:8000/") == "http://10.0.0.5:8000/submit"


def test_qr_is_svg():
    svg = netinfo.qr_svg("http://10.0.0.5:8000/submit")
    assert svg.startswith("<?xml") or svg.startswith("<svg")
    assert "<svg" in svg and "<path" in svg
