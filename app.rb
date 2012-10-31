require 'rubygems'
require 'sinatra'
require 'geokit'
require 'mongoid'

# Add directories to the load path
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__), 'models'))
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__), 'utils'))

# Not sure where the ideal place to put this is.
require 'crimes'
require 'elevations'
require 'accidents'

# Google Maps API configuration
Geokit::Geocoders::google = 'AIzaSyB7TqXugzqy78MGZeCajJKldKeJd8CBj9I'

# Load up Mongoid config
Mongoid.load!("config/mongoid.yml", :production)

# This flag should really be in a config file once we summon
# the strength to create one. Setting this to true disables
# redis caching.
DISABLE_REDIS = true

# AJAX method for getting the crime couunts for a specific route.
post '/get_crime_counts' do
    content_type :JSON
    route_steps = JSON.parse(params['steps'])
    get_crime_counts(route_steps).to_json
end

post '/get_elevations_list' do
    content_type :JSON
    route_steps = JSON.parse(params['steps'])
    
    # get_elevations(route_steps).to_json

    start_location_coords = route_steps[0]['start_location']
    end_location_coords = route_steps[1]['end_location']

    start_lat = start_location_coords['lat']
    start_lon = start_location_coords['lon']

    end_lat = end_location_coords['lat']
    end_lon = end_location_coords['lon']

    [get_climb(start_lat, start_lon, end_lat, end_lon)].to_json
end

post '/get_accident_counts' do
  content_type :JSON
  route_steps = JSON.parse(params['steps'])
  get_accident_counts(route_steps).to_json
end

get '/' do
  erb :main
end
