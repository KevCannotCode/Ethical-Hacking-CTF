"""One SSH login attempt against the bandit host. A successful login means the password is that level's flag."""
import socket

import paramiko

OK, BAD, ERROR = "ok", "bad", "error"


def try_login(host: str, port: int, user: str, password: str, timeout: float) -> tuple[str, str]:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(
            host,
            port=port,
            username=user,
            password=password,
            look_for_keys=False,
            allow_agent=False,
            timeout=timeout,
            banner_timeout=timeout,
            auth_timeout=timeout,
        )
        return OK, ""
    except paramiko.AuthenticationException:
        return BAD, ""
    except (paramiko.SSHException, socket.error, EOFError) as exc:
        return ERROR, str(exc) or type(exc).__name__
    finally:
        client.close()
