import json

def get_request_data(request):
    try:
        if request.content_type.startswith("application/json"):
            return json.loads(request.body.decode() or "{}")

        return request.POST

    except json.JSONDecodeError:
        return None