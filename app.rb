require 'rubygems'
require 'sinatra'
require 'geokit'
require 'mongoid'

# Add directories to the load path
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__), 'models'))

# Google Maps API configuration
Geokit::Geocoders::google = 'AIzaSyB7TqXugzqy78MGZeCajJKldKeJd8CBj9I'

# Load up Mongoid config
Mongoid.load!("config/mongoid.yml", :production)

# AJAX method for getting the crime couunts for a specific route.
# TODO: haven't figured out the format from the frontend. So this
# is temporary.
post '/get_crime_counts' do
	require './utils/crimes' # probably not ideal...?
	content_type :json
	params = request.env['rack.request.query_hash']
	route_steps = JSON.parse(params[:steps])
	get_crime_counts(route_steps).to_json
end

get '/route' do

end

get '/score' do

end

def get_route_from_google do

end
