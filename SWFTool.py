import zlib
from os.path import isfile, isdir, splitext, join, exists, dirname
from os import walk, makedirs
from glob import glob
import logging

def InitiateColorLogger(name='twisted'):
    from colorlog import ColoredFormatter

    logger = logging.getLogger(name)

    stream = logging.StreamHandler()

    LogFormat = "  %(reset)s%(log_color)s%(levelname)-8s%(reset)s | %(log_color)s%(message)s"
    stream.setFormatter(ColoredFormatter(LogFormat, log_colors={
        'DEBUG':    'white',
        'INFO':     'cyan',
        'WARNING':  'yellow',
        'ERROR':    'red',
        'CRITICAL': 'black,bg_red',
    }))

    logger.addHandler(stream)
    logger.setLevel(logging.DEBUG)

    logger.info("Porter running")
    return logger


logger = InitiateColorLogger('SWFTool')

def SWFTool(paths, domain, r = False, o = '', D = False):
	global logger
	logger.info("Shout-out to our friend Ben at Solero for creating this. Logs produced are tl;dr, stay calm have a cookie.")

	for path in paths:
		paths = []
		if isfile(path):
			logger.info("Found \"%s\"", path)
			paths = [path]
		elif isdir(path):
			if not r:
				logger.warning("\"%s\" is a directory but recursion is disabled! skipping...", path)
				continue
			else:
				paths = [y for x in walk(path) for y in glob(join(x[0], '*.swf'))]

		for file in paths:
			logger.info("Found \"%s\"", file)
			filename, file_extension = splitext(file)
			if file_extension != ".swf":
				logger.warning("\"%s\" is not an SWF file! skipping...", path)
				continue

			logger.info("Opening \"%s\"", file)
			raw = open(file, "rb")
			signature = raw.read(3)
			logger.info("Reading file signature for \"%s\"", file)

			if signature != b"CWS":
				logger.warning("File has invalid signature, file sig should be 0x43 0x57 0x43(\"CWS\")")
				continue

			header = raw.read(5)
			data = raw.read()
			logger.info("Read %d bytes from \"%s\"", data.__sizeof__(), file)
			logger.info("Decompressing")
			decompressed_data = zlib.decompress(data)
			original_data = decompressed_data

			if b'\x00clubpenguin\x00boot\x00BootLoader' in decompressed_data:
				logger.info("Found a BootLoader, cracking client checks...")
				s = b'\x00logEvents\x00boot\x00BootL0ader'
				decompressed_data = decompressed_data.replace(b'\x00logEvents\x00boot\x00BootLoader', s)
				s = b'clubpenguin.c0m'
				decompressed_data = decompressed_data.replace(b'clubpenguin.com', s)

			if b'localhost' in decompressed_data:
				logger.info("Found localhost")
				s = bytes(domain.encode())
				decompressed_data = decompressed_data.replace(b'localhost', s)

			if b'clubpenguin.com' in decompressed_data:
				logger.info("Found clubpenguin.com")
				s = bytes(domain.encode())
				decompressed_data = decompressed_data.replace(b'clubpenguin.com', s)

			if b'disney.com' in decompressed_data:
				logger.info("Found disney.com")
				s = bytes(domain.encode())
				decompressed_data = decompressed_data.replace(b'disney.com', s)

			if decompressed_data == original_data:
				logger.warning("No changes were made to the data!")
				continue

			logger.info("Re-compressing data and appending file signature and header")
			compressed = signature + header + zlib.compress(decompressed_data)

			if o:
				file = join(o, file)

			if not exists(dirname(file)):
				makedirs(dirname(file))#, exist_ok=True)

			if D:
				dump = open(file + ".fws", "w")
				dump.write(str(decompressed_data))
				dump.close()
				logger.info("Copied dump to \"%s\"", file + ".fws")

			logger.info("Writing data to \"%s\"", file)
			output = open(file, "wb")
			output.write(compressed)
			output.close()
			raw.close()

	logger.info("Finished assembling swf files!")

path = raw_input('Directory where you have downloaded media-server.\nBy default you might want to enter: \nUbuntu: \n\t/var/www/public_cpps/media1\nWindows and MacOS:\n\t<XAMPP>/htdocs/media1 \n\t(Make sure to replace <XAMPP> with directory where you installed XAMPP, eg: C:\\xampp\\htdocs\\media1\nEnter directory: ')
domain = raw_input("Enter your CPPS domain, eg: mycpps.pw (use localhost if hosting locally and not on a domain): ")

print 'Starting tool...'
SWFTool([path], domain, True)