require 'crime'
require 'locations'

# Returns the number of crime incidents for each step in the route
# route_steps should be (at least) of the form [ {:longitude:} ]
def get_crime_counts(route_steps)

    # A list that represents the number of crime incidents corresponding
    # to each step in the route.
    crimes = []

    route_steps.each do |step|
        
        start_location_coords = step['start_location']
        end_location_coords = step['start_location']

        start_lat = start_location_coords['lat']
        start_lon = start_location_coords['lon']

        end_lat = end_location_coords['lat']
        end_lon = end_location_coords['lon']

        # 1. Get street addresses and prepare it for db comparison

        start_location = get_address(start_lat, start_lon)
        end_location = get_address(end_lat, end_lon)

        # Need these flags as we will need to parse them differently if we don't have
        # the street address
        using_start_full_address = false
        using_end_full_address = false

        start_address = start_location[:street_address] || start_location["street_address"] # fucking hack
        if start_address.nil?
            start_address = start_location[:full_address] || start_location["full_address"]
            using_start_full_address = true
        end

        end_address = end_location[:street_address] || end_location["street_address"]
        if end_address.nil?
            end_address = end_location[:full_address] || end_location["full_address"]
            using_end_full_address = true
        end

        if start_address.nil? or end_address.nil?
            # We give up.
            crimes.push(0)
        else

            if using_start_full_address
                # We don't have street number so make start block zero. It sucks, but it'll have to do (for now)
                start_street_number = 0
                start_block = 0
                street_name = start_address[/^[A-Za-z\s]+/].strip.upcase # "Market St & Stockton St" => "MARKET ST"
            else
                start_street_number = start_address[/^\d+/].to_i # "100 Market St" => 100
                start_block = get_block(start_street_number)
                street_name = start_address[/[A-Za-z\s]+/].strip.upcase # "100 Market St" => "MARKET ST"
            end

            if using_end_full_address
                end_street_number = 9999 # some arbitrarily large number
                end_block = 9999
            else
                end_street_number = end_address[/^\d+/].to_i
                end_block = get_block(end_street_number)
            end

            # 2. Count db matches. Want to find number of incidents where start_block <= block <= end_block
            # on the given steet_name

            # print start_block
            # print "\n"
            # print end_block
            # print "\n"
            # print street_name
            # print "\n"
            # print start_address
            # print "\n"
            # print end_address
            # print "\n"

            incidents = Crime.where(:block.gte => start_block, :block.lte => end_block)
                             .where(:street.in => [street_name])
                             .count

            crimes.push(incidents)

        end


    end

    return crimes

end

def setup_crimes_collection()
    crimes = JSON.parse(File.open("../resources/crimes.json", "r").read)
    Crime.collection.insert(crimes)
end
