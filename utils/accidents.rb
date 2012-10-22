require 'nokogiri'
require 'rest-client'
require 'json'
require 'geocoder'
require 'ruby-debug'
require 'mongo'
require 'geokit'

#If you don't have accidents_geocoded.json
#First run scrape
#Then run geocode
#Finally run populate

#If you have accidents_geocoded.json
#Just run populate

$db = Mongo::Connection.new()["hackathon_rerout"]

def scrape
  f = File.open("accidents.json", "w")
  f.write("[")
  (1..45).to_a.each do |page_count|
    page = RestClient.get "http://www.baycitizen.org/data/bike-accidents/raw-data/?page=#{page_count}&date_from=20050101&date_to=20091231&county=87"
    n_page = Nokogiri::HTML.parse(page)
  #  n_page.css("

    header = n_page.css("thead").children[0]

    n_page.css("#raw-data-table tbody tr").each do |row|
      accident = {}
      header.children.each_with_index do |column, index|
        accident[column.text] = row.children[index].text if column.text.strip != ""
      end
      f.write(accident.to_json + ",\n")
    end

    puts page_count
  end
  f.write("]")
  f.close
end

def geocode
  json = File.read("accidents.json")
  f = File.open("accidents_geocoded.json", "w")
  f.write("[")
  jsons = JSON.parse(json)
  count = 0
  jsons.each_with_index do |json, index|
#    if index > 1797
      query = "#{json["Street1"]} and #{json["Street2"]}, San Francisco"
      #result = Geocoder.search(query)
      result = Geokit::Geocoders::GoogleGeocoder.geocode(query)
      if result
        #json.merge!(result[0].data["geometry"]["location"])
        json.merge!({"lat" => result.lat, "lng" => result.lng})
        f.write(json.to_json + ",\n")
        puts query
        puts json
        sleep(0.75)
      end
#    end
  end

  f.write("]")
  f.close
end

def populate
  jsons = JSON.parse(File.read("accidents_geocoded.json"))
#  jsons = JSON.parse(File.read("test_accidents.json"))
  coll = $db["accidents"]
  jsons.each do |json|
    coll.insert(json.merge({"loc" => {"lat" => json["lat"], "lng" => json["lng"]}}))
  end
  $db["accidents"].ensure_index([["loc","2d"]])
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
