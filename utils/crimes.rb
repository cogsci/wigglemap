require 'json'
require 'crime'
require 'geokit'

SLEEP_TIME = 1.0 / 100.0

# Returns the number of crime incidents for each step in the route
# route_steps should be (at least) of the form [ {:longitude:} ]
def get_crime_counts(route_steps)

	# A list that represents the number of crime incidents corresponding
	# to each step in the route.
	crimes = []

	route_steps.each do |step|
		
		start_lat = step[:start_location][:lat]
		start_lon = step[:start_location][:lon]

		end_lat = step[:end_location][:lat]
		end_lon = step[:end_location][:lon]

		# 1. Get street addresses and prepare it for db comparison

		start_location = Geokit::Geocoders::GoogleGeocoder.reverse_geocode(start_lat.to_s + "," + start_lon.to_s).hash
		sleep(SLEEP_TIME)
		end_location = Geokit::Geocoders::GoogleGeocoder.reverse_geocode(end_lat.to_s + "," + end_lon.to_s).hash

		start_address = start_location[:street_address]
		end_address = end_location[:street_address]

		start_street_number = start_address[/^\d+/]
		end_street_number = end_address[/^\d+/]

		start_street_number_rank = start_street_number.size - 1
		end_street_number_rank = end_street_number.size - 1

		start_block = (start_street_number.to_i / start_street_number_rank) * start_street_number_rank # Converts something like 123 into 100
		end_block = (end_street_number.to_i / end_street_number_rank) * end_street_number_rank

		# Assuming start and end street are the same
		street_name = start_address[/[A-Za-z\s]+$/].strip.upcase  # "100 Market St" => "MARKET ST"

		# 2. Count db matches. Want to find number of incidents where start_block <= block <= end_block
		# on the given steet_name

		incidents = Crime.where(:block.gte => start_block, :block.lte => end_block)
		                 .where(:street.in => [street_name])
		                 .count

		crimes.push(incidents)


	end

	return crimes

end

def setup_crimes_collection()
	crimes = JSON.parse(File.open("../resources/crimes.json", "r").read)
	Crime.collection.insert(crimes)
end
