
def open_file(fname):
    try:
        fin = open(fname, 'r')
        data = fin.readlines()
        fin.close()
        return data
    except:
        print 'File %s not opened' % fname
        return False

csvfile = "C:\\Users\\vasanthakumars\\Documents\\GitHub\\BEnMap\\resources\\Energy_Reporting_Data_Sept2016_CLEAM.csv"
lstofbld = open_file(csvfile)

for i,bld in enumerate(lstofbld):
    if True:#i > 4:#abs(i-5.)<0.001:
        lstofinfo = bld.split(',')
        if i==0:
            for j,bldinfo in enumerate(lstofinfo):
                print j,bldinfo,
        type,use,gfa,eui,energy_star_score,energy_star_cert = 'err','err','err','err','err','err'
        if True:#try:
            type = lstofinfo[2]
            use = lstofinfo[10]
            gfa = lstofinfo[5]
            eui = lstofinfo[6]
            energy_star_score = lstofinfo[7]
            energy_star_cert = lstofinfo[8]
            year_built = lstofinfo[10]
        #except:
        #    pass
        #    print 'error'
        #print '\n'
        #print 'pulling', type#, '|', use#, gfa, energy_star_score, energy_star_cert
        #print '----'
        
        # Identify the building type
        chktype = False
        mediansiteeui = None
        
        if "Education" in type:
            mediansrceui = 144.
        elif "College" in type:
            mediansiteeui = 244.
        elif "Food Sales" in type:
            mediansiteeui = 570.
        elif "Convenience" in type:
            mediansiteeui = 657.
        elif "Food Service" in type:
            mediansiteeui = 575. 
        elif "Restaurant" in type:
            mediansiteeui = 434.
        elif "Fast Food" in type:
            mediansiteeui = 1170. 
        elif "Lodging" in type:
            mediansiteeui = 163.
        elif "Mall" in type:
            mediansiteeui = 247. 
        elif "Outpatient" in type:
            mediansiteeui = 163.
        elif "Clinic" in type:
            mediansiteeui = 194.
        elif "Public Assembly" in type:
            mediansiteeui = 89.
        elif "Entertainment" in type:
            mediansiteeui = 94.
        elif "Library" in type:
            mediansiteeui = 246.
        elif "Recreation" in type:
            mediansiteeui = 100.
        elif "Social" in type:
            mediansiteeui = 71.
        elif "Public Order and Safety" in type:
            mediansiteeui = 161.
        elif "Police Station" in type:
            mediansiteeui = 146.
        elif "Vehicle Repair" in type:
            mediansiteeui = 96.
        elif "Storage" in type or "Shipping" in type:
            mediansiteeui = 28.
        elif "Retail Store" in type:
            mediansiteeui = 139.
        else:
            mediansiteeui = 127.
        
            
        
        #
        
        #print i
        
        if chktype:
            print bld
            print 'median', mediansiteeui
            print 'escore', energy_star_score #score of "simulated" performance vs mediansiteeui
            print 'energy', eui
            print 'eui', eui, 'm', mediansiteeui
            print 'year', year_built
            
            try:
                if abs(year_built-2010) > 0.01:
                    energy_target = float(mediansiteeui) * 0.2
                else:
                    energy_target = float(mediansiteeui) * 0.7
            except Exception as e:
                print str(e)