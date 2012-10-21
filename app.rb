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

# Google Maps API configuration
Geokit::Geocoders::google = 'AIzaSyB7TqXugzqy78MGZeCajJKldKeJd8CBj9I'

# Load up Mongoid config
Mongoid.load!("config/mongoid.yml", :production)

# AJAX method for getting the crime couunts for a specific route.
# TODO: haven't figured out the format from the frontend. So this
# is temporary.
post '/get_crime_counts' do
    content_type :JSON
    route_steps = JSON.parse(params['steps'])
    get_crime_counts(route_steps).to_json
end

post '/get_elevations_list' do
    content_type :JSON
    route_steps = JSON.parse(params['steps'])
    get_elevations(route_steps).to_json
end

get '/route' do

end

get '/score' do

end
