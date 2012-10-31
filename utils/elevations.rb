require 'api_call'

def get_elevations(route_steps)
    elevations = []

    route_steps.each do |step|
        
        start_location_coords = step['start_location']
        end_location_coords = step['end_location']

        start_lat = start_location_coords['lat']
        start_lon = start_location_coords['lon']

        end_lat = end_location_coords['lat']
        end_lon = end_location_coords['lon']

        elevations.push(get_climb(start_lat, start_lon, end_lat, end_lon))

    end

    return elevations

end

def get_climb(start_lat, start_lon, end_lat, end_lon)
    return (get_elevation(end_lat, end_lon) - get_elevation(start_lat, start_lon)).ceil
end


def get_elevation(lat, lon)

    redis = nil

    unless DISABLE_REDIS
        redis_key = "elevation:" + lat.to_s + ":" + lon.to_s
        begin
            uri = URI.parse("redis://teamfordiana:762434c9baa0934e21de1af5bf8c10c4@herring.redistogo.com:10078")
            redis = Redis.new(:host => uri.host, :port => uri.port, :password => uri.password)
            #redis = Redis.new
        rescue
            # no redis installed
        end
    end

    unless redis.nil?
        cached_elevation = redis.get(redis_key)
        unless cached_elevation.nil?
            return cached_elevation.to_f
        end
    end

    req_url = "http://maps.googleapis.com/maps/api/elevation/json?locations=" + lat.to_s + "," + lon.to_s + "&sensor=false"
    data = get_json(req_url)
    sleep(SLEEP_TIME)

    if data["status"] == "OK"
        elevation = data["results"][0]["elevation"]
        unless redis.nil?
            redis.set(redis_key, elevation)
        end
        return elevation
    else
        return 0
    end

end
