require 'api_call'

def get_climb(start_lat, start_lon, end_lat, end_lon)
    return (get_elevation(end_lat, end_lon) - get_elevation(start_lat, start_lon)).ceil
end


def get_elevation(lat, lon)
    req_url = "http://maps.googleapis.com/maps/api/elevation/json?locations=" + lat.to_s + "," + lon.to_s + "&sensor=false"
    data = get_json(req_url)
    if data["status"] == "OK"
        return data["results"][0]["elevation"]
    else
        return 0
    end
end
