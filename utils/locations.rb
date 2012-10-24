require 'redis'
require 'json'
require 'geokit'
require 'api_call'

# utility methods related to geocoding and shit

# get address information from google
def get_address(lat,lon)

    cached_location = nil

    begin 
        uri = URI.parse("redis://teamfordiana:762434c9baa0934e21de1af5bf8c10c4@herring.redistogo.com:10078")
        redis = Redis.new(:host => uri.host, :port => uri.port, :password => uri.password)
#        redis = Redis.new  # err, should do this elsewhere?
        
    rescue Exception => e
        print "redis-server is not running\n"
        # redis-server probabably isn't running
    end

    coords = lat.to_s + "," + lon.to_s

    unless redis.nil?
        cached_result = redis.get(coords)
        unless cached_result.nil?
            begin
                cached_location = JSON.parse(cached_result)
            rescue
                # invalid json
            end
        end
    end

    if cached_location.nil?
        location = Geokit::Geocoders::GoogleGeocoder.reverse_geocode(coords).hash
        sleep(SLEEP_TIME)
    else
        location = cached_location
    end

    # If redis is initialized, cache google results
    unless redis.nil?
        redis.set(coords, location.to_json)
    end

    return location

end

# Returns the block of the given street number
# 123 => 100, 50 => 0, 1234 => 1000
def get_block(street_number)
    if street_number < 100
        return 0
    else
        rank = street_number.to_s.size
        return (street_number / rank) * rank
    end
end
