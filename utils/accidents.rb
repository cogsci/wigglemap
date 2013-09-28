require 'nokogiri'
require 'rest-client'
require 'json'
require 'geocoder'
require 'mongo'
require 'geokit'

$db = Mongo::Connection.new(ENV["HACKATHON_REROUTE_MONGO_SERVER"], ENV["HACKATHON_REROUTE_MONGO_PORT"])["hackathon_reroute"]
begin
  $auth = $db.authenticate(ENV["HACKATHON_REROUTE_MONGO_USERNAME"], ENV["HACKATHON_REROUTE_MONGO_PASSWORD"])
rescue
  #do nothing for now
end

def get_accident_counts(steps)
  accidents = []
  steps.each do |step|
    points = $db["accidents"].find({"loc" => {"$within"  => {"$polygon" => generate_polygon(step)}}}).to_a
    accidents << points.count
  end
  accidents
end

def generate_polygon(step)
  {"a" => {"lat" => step["start_location"]["lat"]+0.001, "lng" => step["start_location"]["lon"]+0.001},
  "b" => {"lat" => step["end_location"]["lat"]+0.001, "lng" => step["start_location"]["lon"]+0.001},
  "c" => {"lat" => step["end_location"]["lat"] - 0.001, "lng" => step["start_location"]["lon"]-0.001},
  "d" => {"lat" => step["start_location"]["lat"] - 0.001, "lng" => step["start_location"]["lon"]-0.001}}
end

#populate
#geocode
#scrape
