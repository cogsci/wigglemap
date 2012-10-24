require 'nokogiri'
require 'rest-client'
require 'json'
require 'geocoder'
require 'mongo'
require 'geokit'

#If you don't have accidents_geocoded.json
#First run scrape
#Then run geocode
#Finally run populate

#If you have accidents_geocoded.json
#Just run populate

$db = Mongo::Connection.new()["hackathon_rerout"]

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
